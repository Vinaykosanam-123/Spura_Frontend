export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export type DiagramType = "array_pointers" | "linked_list" | "binary_tree" | "stack" | "graph";

export interface Problem {
  id: string;
  dbId?: string;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  acceptance: string;
  companies: string[];
  diagramType: DiagramType;
  description: string;
  examples: ProblemExample[];
  constraints: string[];
  templates: {
    python: string;
    javascript: string;
    cpp: string;
    java: string;
  };
  defaultStdin: string;
}

import { ARRAYS_SLIDING_PROBLEMS } from "./problems-data/arrays-sliding";
import { STRINGS_SEARCH_PROBLEMS } from "./problems-data/strings-search";
import { LISTS_STACKS_PROBLEMS } from "./problems-data/lists-stacks";
import { TREES_DP_GRAPHS_PROBLEMS } from "./problems-data/trees-dp-graphs";

export const CURATED_PROBLEMS: Problem[] = [
  ...ARRAYS_SLIDING_PROBLEMS,
  ...STRINGS_SEARCH_PROBLEMS,
  ...LISTS_STACKS_PROBLEMS,
  ...TREES_DP_GRAPHS_PROBLEMS,
];
