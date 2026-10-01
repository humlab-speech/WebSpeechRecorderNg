import {Injectable} from "@angular/core";
import {Observable, forkJoin, map, of} from "rxjs";
import {Script} from "./script";
import {ScriptService} from "./script.service";
import {PrefillChoice, PrefillChoices, PrefillSource, PrefillSpec, ScriptPrefillUtil} from "./prefill";
import {Session} from "../session/session";
import {SprLogger} from "../../utils/logger";

/** The script with every prefill resolved, and which list was drawn per placeholder item. */
export interface ResolvedScript {
  script: Script;
  choices: PrefillChoices;
}

/**
 * Resolves the prefill declarations of a script when it is loaded: fetches each source from
 * the script bank, draws the lists and expands the placeholder items.
 *
 * A draw is either the choice already stored on the session (so a reload reproduces the same
 * prompt items and matches already recorded files) or a fresh random pick. The resulting
 * choices are handed back to the caller, which persists them on the session.
 */
@Injectable()
export class ScriptPrefillService {

  constructor(private scriptService: ScriptService) {}

  resolve(script: Script, session: Session | null | undefined): Observable<ResolvedScript> {
    const specs = ScriptPrefillUtil.specs(script);
    if (specs.length === 0) {
      return of({script, choices: {}});
    }
    const sourceIds = Array.from(new Set(specs.map((spec) => spec.spec.source)));
    const sources = sourceIds.map((sourceId) =>
      this.scriptService.scriptResourceObservable<PrefillSource>(sourceId)
        .pipe(map((source) => [sourceId, source] as const))
    );
    return forkJoin(sources).pipe(map((fetched) => {
      const sourceMap = new Map<string, PrefillSource>(fetched.map(([id, source]) => [id, source]));
      const stored = session?.prefills ?? {};
      const choices: PrefillChoices = {};
      for (const group of ScriptPrefillService.groupByLink(specs)) {
        ScriptPrefillService.drawGroup(group, sourceMap, stored, choices);
      }
      return {script: ScriptPrefillUtil.expand(script, sourceMap, choices), choices};
    }));
  }

  /** The stored choice when it is usable; a fresh random draw otherwise. */
  private static draw(sourceId: string, source: PrefillSource | undefined, stored: PrefillChoice | null | undefined, itemcode: string): PrefillChoice {
    const reusable = ScriptPrefillUtil.choiceFor(sourceId, stored);
    if (reusable != null) {
      const list = ScriptPrefillUtil.drawList(source ?? {lists: []}, reusable);
      if (list != null) {
        return reusable;
      }
      SprLogger.warn(`Session holds prefill choice '${stored?.list}' for item ${itemcode}, but source '${sourceId}' has no such list; drawing a fresh one.`);
    }
    if (source == null) {
      throw new Error(`prefill of item ${itemcode}: source '${sourceId}' could not be fetched`);
    }
    const list = ScriptPrefillUtil.drawList(source, null);
    if (list == null) {
      throw new Error(`prefill of item ${itemcode}: source '${sourceId}' holds no lists`);
    }
    return {source: sourceId, list: list.id};
  }

  /**
   * Partitions the specs into draw groups: linked specs (same `link`) share one group, every
   * unlinked spec is its own group. Groups keep the first-seen order of their members.
   */
  private static groupByLink(specs: Array<PrefillSpec>): Array<Array<PrefillSpec>> {
    const linked = new Map<string, Array<PrefillSpec>>();
    const groups: Array<Array<PrefillSpec>> = [];
    for (const spec of specs) {
      const link = spec.spec.link;
      if (link == null || link === '') {
        groups.push([spec]);
        continue;
      }
      const group = linked.get(link);
      if (group != null) {
        group.push(spec);
      } else {
        const created = [spec];
        linked.set(link, created);
        groups.push(created);
      }
    }
    return groups;
  }

  /**
   * Draws a group. A single-member group is the plain per-item draw. A linked group draws one
   * shared list id and resolves it against each item's own source, so paired items (e.g. STI
   * word and sentence lists) always use the same list number. A stored choice always wins for
   * its own item, so a reload reproduces the already-recorded pairing even when it predates
   * the link; it also seeds the shared id for any still-fresh sibling.
   */
  private static drawGroup(
    specs: Array<PrefillSpec>,
    sourceMap: Map<string, PrefillSource>,
    stored: PrefillChoices,
    choices: PrefillChoices,
  ): void {
    if (specs.length === 1) {
      const {itemcode, spec} = specs[0];
      choices[itemcode] = ScriptPrefillService.draw(spec.source, sourceMap.get(spec.source), stored[itemcode], itemcode);
      return;
    }

    let sharedId: string | undefined;
    for (const {itemcode, spec} of specs) {
      const reusable = ScriptPrefillUtil.choiceFor(spec.source, stored[itemcode]);
      if (reusable != null && ScriptPrefillUtil.drawList(sourceMap.get(spec.source) ?? {lists: []}, reusable) != null) {
        sharedId = reusable.list;
        break;
      }
    }
    if (sharedId === undefined) {
      const withLists = specs.find(({spec}) => (sourceMap.get(spec.source)?.lists.length ?? 0) > 0);
      sharedId = withLists != null ? ScriptPrefillUtil.drawList(sourceMap.get(withLists.spec.source)!, null)?.id : undefined;
    }

    for (const {itemcode, spec} of specs) {
      const source = sourceMap.get(spec.source);
      const reusable = ScriptPrefillUtil.choiceFor(spec.source, stored[itemcode]);
      if (reusable != null) {
        const list = ScriptPrefillUtil.drawList(source ?? {lists: []}, reusable);
        if (list != null) {
          choices[itemcode] = reusable;
          continue;
        }
        SprLogger.warn(`Session holds prefill choice '${reusable.list}' for item ${itemcode}, but source '${spec.source}' has no such list; drawing a fresh one.`);
      }
      if (sharedId !== undefined) {
        const list = ScriptPrefillUtil.drawList(source ?? {lists: []}, {source: spec.source, list: sharedId});
        if (list != null) {
          choices[itemcode] = {source: spec.source, list: sharedId};
          continue;
        }
        SprLogger.warn(`Linked prefill of item ${itemcode}: source '${spec.source}' has no list '${sharedId}'; drawing an independent list.`);
      }
      choices[itemcode] = ScriptPrefillService.draw(spec.source, source, undefined, itemcode);
    }
  }
}
