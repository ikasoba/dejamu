import {
  StateUpdater,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "npm:preact/hooks";
import { ComponentChild, ComponentChildren, createContext } from "npm:preact/";

export interface HeadProps {
  children: ComponentChildren;
}

let headChildren: ComponentChild[] = [];

export const resetHeadChildren = () => headChildren = [];
export const getHeadChildren = () => headChildren;

export function Head({ children }: HeadProps) {
  headChildren.push(children);

  return <></>;
}
