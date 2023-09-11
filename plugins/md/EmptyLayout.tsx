import { Markdown } from "./Markdown.tsx";
import { LayoutComponent } from "./MarkdownPlugin.tsx";

export const EmptyLayout: LayoutComponent = ({ children }) => {
  return (
    <Markdown>
      {children}
    </Markdown>
  );
};

export default EmptyLayout;
