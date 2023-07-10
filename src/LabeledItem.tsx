import { ComponentChildren } from "preact";

export const LabeledItem = ({
  label,
  children,
}: {
  label: ComponentChildren;
  children: ComponentChildren;
}) => (
  <div style={{ width: "100%", marginBottom: "4px" }}>
    <div
      style={{
        width: "50%",
        display: "inline-block" /*, backgroundColor: "green"*/,
        margin: "auto",
      }}
    >
      {label}
    </div>
    <div
      style={{
        width: "50%",
        display: "inline-block" /*, backgroundColor: "orange"*/,
      }}
    >
      {children}
    </div>
  </div>
);
