import {createReactBlockSpec} from "@blocknote/react";

const ButtonBlock = createReactBlockSpec(
  {
    type: "button",
    propSchema: {
      // textAlignment: defaultProps.textAlignment,
      // textColor: defaultProps.textColor,
      formula: {
        default: "",
      }
    },
    content: "none",
    // isSelectable: false,
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      const blockProps = props.block.props;

      return (<>
        <div className="flex flex-row items-center">
          <button className="secondary-button z-10">
            Button
          </button>
          <div className="flex flex-row items-center secondary-button pl-2.5 py-1 pr-1 -ml-2">
            <span className="size-7 icon-[heroicons--cog-6-tooth]"></span>
          </div>
        </div>
      </>);
    },
  }
);

export default ButtonBlock;