import type {
  BlueprintNode,
  PageRoute,
  DesignTokens,
  InteractionRule,
  BreakpointKey,
  CSSProperties,
  ProjectMeta,
  ProjectBlueprint,
  BlueprintAsset
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
      type: 'REORDER_NODE';
      nodeId: string;
      direction: 'up' | 'down';
    }
  | {
      type: 'WRAP_NODE';
      nodeId: string;
      wrapperId?: string;
      wrapperType: 'structure/container' | 'structure/section' | 'structure/grid';
      wrapperName?: string;
      wrapperProps?: Record<string, any>;
    }
  | {
      type: 'UNWRAP_NODE';
      nodeId: string;
    }
  | {
      type: 'UPDATE_NODE_META';
      nodeId: string;
      meta: Partial<
        Pick<
          BlueprintNode,
          'name' | 'locked' | 'hidden' | 'customClasses' | 'customCss' | 'motionEffects'
        >
      >;
    }
  | {
      type: 'PASTE_NODE_STYLE';
      nodeId: string;
      styles: BlueprintNode['styles'];
      customClasses?: string;
      customCss?: string;
      motionEffects?: BlueprintNode['motionEffects'];
    }
  | {
      type: 'RESET_NODE_STYLE';
      nodeId: string;
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
      meta: Partial<Pick<PageRoute, 'title' | 'path' | 'slug' | 'description' | 'seo' | 'layoutId'>>;
    }
  | {
      type: 'UPDATE_PROJECT_META';
      meta: Partial<Pick<ProjectMeta, 'name' | 'slug' | 'description'>>;
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
    }
  | {
      type: 'UPDATE_INTERACTIONS';
      nodeId: string;
      interactions: InteractionRule[];
    }
  | {
      type: 'ADD_ASSET';
      asset: BlueprintAsset;
    }
  | {
      type: 'DELETE_ASSET';
      assetId: string;
    }
  | {
      type: 'LOAD_BLUEPRINT';
      blueprint: ProjectBlueprint;
    }
  | {
      /** Applies several commands atomically as a single undo step. */
      type: 'BATCH';
      label?: string;
      commands: EditorCommand[];
    };
