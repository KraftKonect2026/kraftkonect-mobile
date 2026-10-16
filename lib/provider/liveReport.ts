// The provider's earnings report, read from the server by period. The server adds up the ledger; the app only picks the dates.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";
import { reportRange, ReportPeriod } from "@/lib/bookings/finance";

export const EARNINGS_REPORT_QUERY = gql`query MyEarningsReport($from: DateTime, $to: DateTime) { myEarningsReport(from: $from, to: $to) { labourMinor materialsMinor inspectionMinor netReleasedMinor grossPaidMinor feeMinor jobsCount } }`;

export type EarningsReport = { label: string; labour: number; materials: number; inspection: number; netReleased: number; grossPaid: number; fee: number; jobs: number };
const whole = (v: unknown) => { if (typeof v !== "number" || !Number.isFinite(v) || v < 0) throw new Error("Your earnings report could not be read."); return Math.round(v); };

export function parseReport(data: unknown, label: string): EarningsReport {
  const r = data as Record<string, unknown> | null | undefined;
  if (!r || typeof r !== "object") throw new Error("Your earnings report could not be read.");
  const out = { label, labour: whole(r.labourMinor), materials: whole(r.materialsMinor), inspection: whole(r.inspectionMinor), netReleased: whole(r.netReleasedMinor), grossPaid: whole(r.grossPaidMinor), fee: whole(r.feeMinor), jobs: whole(r.jobsCount) };
  if (out.netReleased !== out.labour + out.materials + out.inspection) throw new Error("Your earnings report did not add up, so it is not shown.");
  return out;
}
export async function loadReport(client: Pick<ApolloClient<unknown>, "query">, ownerId: string, period: ReportPeriod, offset: number, now = new Date()): Promise<EarningsReport> {
  const range = reportRange(period, offset, now);
  const variables = period === "All time" ? {} : { from: new Date(range.start).toISOString(), to: new Date(range.end).toISOString() };
  try {
    const res = await client.query({ query: EARNINGS_REPORT_QUERY as never, variables, fetchPolicy: "no-cache", context: { accountOwnerId: ownerId, queryDeduplication: false } } as never);
    return parseReport((res.data as { myEarningsReport?: unknown } | null)?.myEarningsReport, range.label);
  } catch (e) { throw friendlyError(e); }
}
