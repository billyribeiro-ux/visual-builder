import type {
  BlueprintNode,
  PageRoute,
  DesignTokens,
  InteractionRule,
  BreakpointKey,
  CSSProperties
} from '@app-viz/schema';

export type EditorCommand =
  | {
      type: 'INSERT_NODE';
      targetParentId: string;
      slotName?: string;
      index?: number;
      node: BlueprintNode;
    }
  | {
      type: 'MOVE_NODE';
      nodeId: string;
      targetParentId: string;
      newIndex?: number;
    }
  | {
      type: 'UPDATE_PROPS';
      nodeId: string;
      props: Record<string, any>;
    }
  | {
      type: 'UPDATE_STYLES';
      nodeId: string;
      breakpoint: BreakpointKey | 'base' | 'hover' | 'focus' | 'active';
      styles: CSSProperties;
    }
  | {
      type: 'DELETE_NODE';
      nodeId: string;
    }
  | {
      type: 'DUPLICATE_NODE';
      nodeId: string;
    }
  | {
      type: 'ADD_PAGE';
      page: PageRoute;
    }
  | {
      type: 'DELETE_PAGE';
      pageId: string;
    }
  | {
      type: 'UPDATE_PAGE_META';
      pageId: string;
      meta: Partial<Pick<PageRoute, 'title' | 'path' | 'slug' | 'description' | 'seo'>>;
    }
  | {
      type: 'UPDATE_TOKENS';
      tokens: Partial<DesignTokens>;
    }
  | {
      type: 'ADD_INTERACTION';
      interaction: InteractionRule;
    }
  | {
      type: 'DELETE_INTERACTION';
      interactionId: string;
    };
