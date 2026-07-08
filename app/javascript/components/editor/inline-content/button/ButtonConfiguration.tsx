import SelectButtonSize from "./SelectButtonSize.tsx";
import SelectButtonColor from "./SelectButtonColor.tsx";

export type ButtonSize = "Small" | "Medium" | "Large";
export type ButtonColor =
  | "green"
  | "orange"
  | "blue"
  | "yellow"
  | "red"
  | "black"
  | "white"
  | "pink"
  | "violet";

type ButtonConfigurationValue = {
  formula: string;
  label: string;
  size: ButtonSize;
  color: ButtonColor;
};

type ButtonConfigurationProps = {
  configuration: ButtonConfigurationValue;
  setConfiguration: (configuration: ButtonConfigurationValue) => void;
};

function ButtonConfiguration({
  configuration,
  setConfiguration,
}: ButtonConfigurationProps) {
  return (<>
    <div className="shadow-md border rounded rounded-2 text-sm max-w-[400px] min-w-[300px] bg-gray-100 dark:bg-gray-700">
      <div className="p-2 pt-4 uppercase font-medium text-xs dark:text-gray-100">
        Button settings
      </div>
      <div className="overflow-y-auto">
        <div className="flex flex-col px-2 border-b py-2">
          <label className="text-xs">On click</label>
          <input className="bg-white dark:!bg-gray-800 rounded border border-gray-300 dark:border-gray-600 h-8 p-2 placeholder-neutral-400 dark:placeholder-gray-400"
            value={configuration.formula}
            placeholder="Empty formula"
            onChange={(e) => {
              setConfiguration({...configuration, ...{formula: e.target.value}});
            }}
          />
        </div>
        <div className="flex flex-col py-2 px-2 border-b">
          <div className="font-medium text-sm dark:text-gray-100">Visual</div>
          <label className="mt-2 text-xs">Label</label>
          <input className="bg-white dark:!bg-gray-800 rounded border border-gray-300 dark:border-gray-600 h-8 p-2"
            value={configuration.label}
            onChange={(e) => {
              setConfiguration({...configuration, ...{label: e.target.value}});
            }}
          />

          <div className="flex flex-row items-center gap-2">
            <div className="flex flex-col w-full">
              <SelectButtonColor
                value={configuration.color}
                onChange={(newColor) => {
                  setConfiguration({...configuration, ...{color: newColor}});
                }}
              />
            </div>
            <div className="flex flex-col w-full">
              <SelectButtonSize
                value={configuration.size}
                onChange={(newSize) => {
                  setConfiguration({...configuration, ...{size: newSize}});
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </>);
}

export default ButtonConfiguration;