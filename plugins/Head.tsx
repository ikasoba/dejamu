import type { ComponentChild, ComponentChildren } from "preact";

export interface HeadProps {
  children: ComponentChildren;
}

let headChildren: ComponentChild[] = [];

export const getHeadChildren = () => {
  const res = headChildren;
  headChildren = [];

  return res;
};

export const appendHead = (children: ComponentChildren) => {
  headChildren.push(children);
};

export function Head({ children }: HeadProps) {
  headChildren.push(children);

  return <></>;
}
