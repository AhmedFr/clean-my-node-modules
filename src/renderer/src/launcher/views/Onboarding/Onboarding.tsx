import type { SetSetting } from '@renderer/hooks/useSettings'
import type { Settings } from '@shared/settings.types'
import { type ReactNode, useState } from 'react'
import type { OnboardingStep } from './Onboarding.types'
import { SetupStep } from './SetupStep'
import { WelcomeStep } from './WelcomeStep'

interface OnboardingProps {
  settings: Settings
  setSetting: SetSetting
  accent: string
  /** Finish onboarding: mark onboarded + kick off the first scan. */
  onComplete: () => void
}

/** Guided 2-step first-run setup, shown in the launcher while !settings.onboarded. */
export function Onboarding({ settings, setSetting, accent, onComplete }: OnboardingProps): ReactNode {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  return step === 'welcome' ? (
    <WelcomeStep accent={accent} onNext={() => setStep('setup')} onSkip={onComplete} />
  ) : (
    <SetupStep
      settings={settings}
      setSetting={setSetting}
      accent={accent}
      onBack={() => setStep('welcome')}
      onScan={onComplete}
    />
  )
}
