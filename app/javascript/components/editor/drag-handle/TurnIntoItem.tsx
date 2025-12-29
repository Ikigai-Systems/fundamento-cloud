import {BlockTypeSelectItem, useExtensionState} from '@blocknote/react'
import {blockTypeSelectItems, useBlockNoteEditor, useComponentsContext, useDictionary} from '@blocknote/react'
import {ReactNode, useMemo} from "react";
import {SideMenuExtension} from "@blocknote/core/extensions";

const TurnIntoItem = (props: { children: ReactNode }) => {
  const editor = useBlockNoteEditor<any, any, any>();
  const Components = useComponentsContext();
  const dictionary = useDictionary();

  const block = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });

  const availableItems: BlockTypeSelectItem[] = useMemo(() => {
    return blockTypeSelectItems(dictionary).filter(
      (item) => item.type in editor.schema.blockSchema
    );
  }, [editor, dictionary]);

  const shouldShow: boolean = useMemo(
    () => block !== undefined && availableItems.find((item) => item.type === block.type) !== undefined,
    [block, availableItems]
  );

  if (!shouldShow) {
    return null;
  }

  return (
    <Components.Generic.Menu.Root sub position='right'>
      <Components.Generic.Menu.Trigger>
        <Components.Generic.Menu.Item
          subTrigger={true}
          className={"bn-menu-item"}
        >
          <div className='flex items-center'>
            {props.children}
          </div>
        </Components.Generic.Menu.Item>
      </Components.Generic.Menu.Trigger>

      <Components.Generic.Menu.Dropdown
        sub={true}
        className={"bn-menu-dropdown"}
      >
        {availableItems.map(item => {
          const Icon = item.icon;
          const isSelected = block.type === item.type
              && (item.type !== "heading" || (block.props?.level === item.props.level && block.props?.isToggleable === item.props.isToggleable));

          return (
            <Components.Generic.Menu.Item
              key={item.name}
              checked={isSelected}
              icon={<Icon size={16}/>}
              onClick={() => {
                editor.updateBlock(block, {
                  type: item.type as any,
                  props: item.props as any,
                });
              }}
            >
              {item.name}
            </Components.Generic.Menu.Item>
          )}
        )}

      </Components.Generic.Menu.Dropdown>
    </Components.Generic.Menu.Root>
  )
}

export default TurnIntoItem