import { Project } from "@/types";

type ProjectRouteTarget = Pick<Project, "id" | "status" | "clips">;

export function isProjectReadyForReview(project: ProjectRouteTarget | null | undefined) {
  return Boolean(project && project.status === "ready" && project.clips.length > 0);
}

export function getProjectPrimaryRoute(project: ProjectRouteTarget | null | undefined) {
  if (!project) {
    return "/dashboard";
  }

  return isProjectReadyForReview(project)
    ? `/project/${project.id}/clips`
    : `/project/${project.id}/processing`;
}
