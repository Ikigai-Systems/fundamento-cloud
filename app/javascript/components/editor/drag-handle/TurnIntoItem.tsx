import type {DragHandleMenuProps} from '@blocknote/react'
import {blockTypeSelectItems, useBlockNoteEditor, useComponentsContext, useDictionary} from '@blocknote/react'
import {useMemo} from "react";

const TurnIntoItem = (props: DragHandleMenuProps) => {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();
  const Block = Components.Generic.Menu;
  const dict = useDictionary();

  const filteredItems: BlockTypeSelectItem[] = useMemo(() => {
    return blockTypeSelectItems(dict).filter(
      (item) => item.type in editor.schema.blockSchema
    );
  }, [editor, dict]);

  const shouldShow: boolean = useMemo(
    () => filteredItems.find((item) => item.type === props.block.type) !== undefined,
    [props.block.type, filteredItems]
  );

  if (!shouldShow) {
    return null;
  }

  return (
    <Block.Root sub position='right'>
      <Block.Trigger>
        <Block.Item subTrigger icon={<span>dupa</span>}>
          <div className='flex items-center'>
            Turn Into
          </div>
        </Block.Item>
      </Block.Trigger>
      <Block.Dropdown>
        {blockTypeSelectItems(dict).map(item => {
          const Icon = item.icon;
          return (
            <Components.Generic.Menu.Item
              key={item.name}
              checked={item.isSelected(props.block)}
              onClick={() => {
                editor.focus();
                editor.updateBlock(props.block, {
                  type: item.type as any,
                  props: item.props as any,
                });
              }}
            >
              <div className="flex flex-row">
                <Icon size={16}/>
                <div className="ml-2">{item.name}</div>
              </div>
            </Components.Generic.Menu.Item>
          )}
        )}

      </Block.Dropdown>
    </Block.Root>
  )
}

export default TurnIntoItem