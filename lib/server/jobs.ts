import { ProcessingEventPayload } from "@/types";

type Listener = (event: ProcessingEventPayload) => void;

const jobProgress = new Map<string, ProcessingEventPayload>();
const listeners = new Map<string, Set<Listener>>();

export function publishJobEvent(event: ProcessingEventPayload) {
  jobProgress.set(event.projectId, event);
  const jobListeners = listeners.get(event.projectId);

  if (!jobListeners) {
    return;
  }

  for (const listener of jobListeners) {
    listener(event);
  }
}

export function getLatestJobEvent(projectId: string) {
  return jobProgress.get(projectId);
}

export function subscribeToJob(projectId: string, listener: Listener) {
  const jobListeners = listeners.get(projectId) ?? new Set<Listener>();
  jobListeners.add(listener);
  listeners.set(projectId, jobListeners);

  return () => {
    jobListeners.delete(listener);
    if (jobListeners.size === 0) {
      listeners.delete(projectId);
    }
  };
}
