import React from "react";
import "./CheckSelect.css";
import Select, { components, MultiValue, ActionMeta, ValueContainerProps, OptionProps } from "react-select";
import Check from "../common/Check";
import { multiSelectStyle } from "../common/etc/SelectStyle";
import { GenericOption } from "../../enums";
import { book_options_all } from "../../Options";

const Option = (props: OptionProps<GenericOption<any>>) => {
  return (
    <div>
      <components.Option {...props}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <label>{props.label}</label>
          <Check checkActive={props.isSelected} />
        </div>
      </components.Option>
    </div>
  );
};

const ValueContainerBook = ({ children, ...props }: ValueContainerProps<GenericOption<any>>) => {
  const { getValue, hasValue } = props;
  const newChildren = [];
  const count = getValue().length;
  if (count === 1) {
    newChildren.push(getValue()[0]["label"]);
  } else if (props.options.length === count) {
    newChildren.push(`All Books`);
  } else {
    newChildren.push(`${count} Books`);
  }
  if (children !== null && children !== undefined) {
    newChildren.push(children[1 as keyof typeof children]);
  }
  if (!hasValue) {
    return <components.ValueContainer {...props}>{children}</components.ValueContainer>;
  }
  return <components.ValueContainer {...props}>{newChildren}</components.ValueContainer>;
};

const ValueContainerSport = ({ children, ...props }: ValueContainerProps<GenericOption<any>>) => {
  const { getValue, hasValue } = props;
  const newChildren = [];
  const count = getValue().length;
  if (count === 1) {
    newChildren.push(getValue()[0]["label"]);
  } else if (props.options.length === count) {
    newChildren.push(`All Sports`);
  } else {
    newChildren.push(`${count} Sports`);
  }
  if (children !== null && children !== undefined) {
    newChildren.push(children[1 as keyof typeof children]);
  }
  if (!hasValue) {
    return <components.ValueContainer {...props}>{children}</components.ValueContainer>;
  }
  return <components.ValueContainer {...props}>{newChildren}</components.ValueContainer>;
};

interface CheckSelectProps<T> {
  id: string;
  options: GenericOption<T>[];
  value: GenericOption<T>[];
  setValue: React.Dispatch<React.SetStateAction<GenericOption<T>[]>>;
}

export default function CheckSelect<T>({ id, options, setValue, value }: CheckSelectProps<T>) {
  const handleSelectAll = (selectAll: boolean) => {
    selectAll ? setValue(options) : setValue([]);
  };

  const handleChange = (selected: MultiValue<GenericOption<T>>, action: ActionMeta<GenericOption<T>>) => {
    if (action.action === "select-option" && action.option && action.option.value === "all") {
      handleSelectAll(true);
    } else if (action.action === "deselect-option" && action.option && action.option.value === "all") {
      handleSelectAll(false);
    } else if (action.action === "select-option" && selected.length === options.length - 1) {
      handleSelectAll(true);
    } else {
      if (action.action === "deselect-option" && selected.length === options.length - 1) {
        selected = selected.filter((obj) => obj.value !== "all");
      }
      const multiValueSelected = selected.map((option) => ({ value: option.value, label: option.label }));
      setValue(multiValueSelected);
    }
  };

  const ValueContainer = options === book_options_all ? ValueContainerBook : ValueContainerSport;

  return (
    <div>
      <Select
        styles={multiSelectStyle}
        id={id}
        className="dropdown"
        isMulti={true}
        components={{
          MultiValueContainer: () => null,
          Option,
          ValueContainer,
        }}
        hideSelectedOptions={false}
        closeMenuOnSelect={false}
        blurInputOnSelect={false}
        isSearchable={false}
        isClearable={false}
        options={options}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}
