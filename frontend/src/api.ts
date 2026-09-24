// WebSocket API of the backend (custom_components/cyd_studio/websocket_api.py)
import type {
  Board, GenerateResult, Hass, Project, ProjectSummary, StudioInfo, Template, Theme, WidgetDef,
} from "./types";

export class Api {
  constructor(private hass: Hass) {}

  setHass(hass: Hass): void {
    this.hass = hass;
  }

  private ws<T>(type: string, data: Record<string, unknown> = {}): Promise<T> {
    return this.hass.callWS<T>({ type: `cyd_studio/${type}`, ...data });
  }

  info = () => this.ws<StudioInfo>("info");
  boards = () => this.ws<Board[]>("boards/list");
  widgets = () => this.ws<WidgetDef[]>("widgets/list");
  themes = () => this.ws<Theme[]>("themes/list");
  templates = () => this.ws<Template[]>("templates/list");
  projects = () => this.ws<ProjectSummary[]>("projects/list");
  project = (projectId: string) => this.ws<Project>("projects/get", { project_id: projectId });
  save = (project: Project) => this.ws<Project>("projects/save", { project });
  remove = (projectId: string) => this.ws<null>("projects/delete", { project_id: projectId });
  duplicate = (projectId: string) => this.ws<Project>("projects/duplicate", { project_id: projectId });
  importProject = (project: Project) => this.ws<Project>("projects/import", { project });
  importYaml = (yaml: string) => this.ws<Project>("projects/import", { yaml });
  generate = (project: Project, markExported = false) =>
    this.ws<GenerateResult>("generate/yaml", { project, mark_exported: markExported });
}
