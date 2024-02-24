import { ComponentType } from "preact";

export interface RendererProps {
  content: string;
}

export type RendererComponent<P extends RendererProps = RendererProps> =
  ComponentType<P>;
