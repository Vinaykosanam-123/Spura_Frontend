'use client';

interface Props {
  slug: string;
  title: string;
  isAuthed: boolean;
  children: React.ReactNode;
}

/**
 * All 11 interactive visualizers are unlocked seamlessly inside the unified lab
 * so learners are never blocked after opening only Sorting or Stack & Queue.
 */
export default function TrialGate({ children }: Props) {
  return <>{children}</>;
}
