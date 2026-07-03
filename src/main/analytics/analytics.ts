import { PostHog } from 'posthog-node'

const POSTHOG_KEY = 'phc_pLfY5cBKu6em8uBmhaoddk3yCYLhaGR43K7okmZCG4vK'
const POSTHOG_HOST = 'https://eu.i.posthog.com'

export const ANALYTICS_EVENTS = [
  'app_launched',
  'onboarding_completed',
  'scan_completed',
  'paywall_shown',
  'buy_clicked',
  'license_activated',
  'license_revalidated',
  'clean_performed',
  'analytics_disabled',
] as const
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number]

/** The only events the renderer may originate over IPC. */
export const RENDERER_EVENTS: readonly AnalyticsEvent[] = ['paywall_shown', 'buy_clicked']

export type AnalyticsProps = Record<string, string | number | boolean>

/** Structural subset of posthog-node we use; injectable for tests. */
export interface PostHogLike {
  capture(msg: { distinctId: string; event: string; properties?: Record<string, unknown> }): void
  shutdown(): Promise<void>
}

/**
 * Thin funnel-analytics wrapper. The privacy floor lives here by construction:
 * callers can only pass flat primitive properties, and every capture goes
 * through the enabled() gate. `client` is null in dev so local runs never
 * pollute launch data.
 */
export class Analytics {
  private client: PostHogLike | null

  constructor(
    private enabled: () => boolean,
    private distinctId: string,
    client?: PostHogLike | null,
  ) {
    this.client = client !== undefined ? client : new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST })
  }

  capture(event: AnalyticsEvent, properties?: AnalyticsProps): void {
    if (!this.client || !this.enabled()) return
    this.client.capture({ distinctId: this.distinctId, event, properties })
  }

  /** Links this install to the buyer email as a person property. */
  identify(email: string): void {
    if (!this.client || !this.enabled()) return
    this.client.capture({ distinctId: this.distinctId, event: '$set', properties: { $set: { email } } })
  }

  /** The one deliberate exception to the gate: sent at the moment of opting out. */
  noteOptOut(): void {
    this.client?.capture({ distinctId: this.distinctId, event: 'analytics_disabled' })
  }

  async shutdown(): Promise<void> {
    await this.client?.shutdown()
  }
}
