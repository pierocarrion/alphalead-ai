import { deriveTaskEnhanced, looksLikeTask } from "@/features/tasks/lib/detect";
import {
  AgentEvent,
  AgentResult,
  TaskDetectionInput,
  TaskDetectionOutput,
} from "./aiTypes";

export async function detectTaskFromMessage(
  input: TaskDetectionInput
): Promise<TaskDetectionOutput> {
  const { text, channelId, fromUserId } = input;
  if (!looksLikeTask(text)) {
    return { detected: null, action: null };
  }

  const detected = await deriveTaskEnhanced(text, fromUserId);
  return {
    detected,
    action: {
      agent: "task-detector",
      type: "suggest_task",
      summary: `Detected possible task in channel ${channelId}: ${detected.title}`,
      data: { detected },
    },
  };
}

export async function coordinate(event: AgentEvent): Promise<AgentResult> {
  const actions: AgentResult["actions"] = [];
  const log: string[] = [`event=${event.type} user=${event.userId}`];

  switch (event.type) {
    case "message_sent": {
      const text = String(event.payload.text ?? "");
      const channelId = String(event.payload.channelId ?? "");
      const fromUserId = event.payload.fromUserId as string | undefined;
      const result = await detectTaskFromMessage({ text, channelId, fromUserId });
      if (result.action) {
        actions.push(result.action);
        log.push("task-detector: suggested task");
      }
      break;
    }

    case "task_created": {
      actions.push({
        agent: "ritual-suggester",
        type: "offer_2min_unlock",
        summary: "Offer a 2-minute unlock ritual for the new task",
        data: { taskId: event.payload.taskId },
      });
      log.push("ritual-suggester: offered unlock");
      break;
    }

    case "ritual_completed": {
      actions.push({
        agent: "momentum-bot",
        type: "celebrate_start",
        summary: "Celebrate that the user crossed the starting line",
        data: { recoveredMinutes: event.payload.recoveredMinutes },
      });
      log.push("momentum-bot: celebrated start");
      break;
    }

    case "pair_request": {
      actions.push({
        agent: "pair-matcher",
        type: "match_partners",
        summary: "Find an available teammate to start alongside",
        data: { requesterId: event.userId, taskId: event.payload.taskId },
      });
      log.push("pair-matcher: queued match");
      break;
    }

    case "daily_check": {
      actions.push({
        agent: "health-check",
        type: "run_workspace_health",
        summary: "Run daily workspace health check",
        data: { workspaceId: event.workspaceId },
      });
      log.push("health-check: queued daily scan");
      break;
    }
  }

  return { actions, log };
}
