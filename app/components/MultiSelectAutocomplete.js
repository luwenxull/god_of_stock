import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Input,
  Listbox,
  ListboxItem,
} from "@nextui-org/react";

export default function MultiSelectAutocomplete(props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));

  const items = [
    {
      key: "new",
      label: "New file",
    },
    {
      key: "copy",
      label: "Copy link",
    },
    {
      key: "edit",
      label: "Edit file",
    },
    {
      key: "delete",
      label: "Delete file",
    },
  ];

  return (
    <Popover isOpen={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <PopoverTrigger>
        <Button>Open Popover</Button>
        {/* <Input label={props.label} className={props.className}/> */}
      </PopoverTrigger>
      <PopoverContent className="max-w-xs">
      <Listbox
          // isVirtualized
          className="max-w-xs"
          label={"Select from 1000 items"}
          placeholder="Select..."
          // virtualization={{
          //   maxListboxHeight: 400,
          //   itemHeight: 40,
          // }}
        >
          {items.map((item, index) => (
            <ListboxItem key={index} value={item.value}>
              {item.label}
            </ListboxItem>
          ))}
        </Listbox>
      </PopoverContent>
    </Popover>
  );
}
