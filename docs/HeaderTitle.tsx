import { getFrame } from "./frame";

import React from "react";

export { HeaderTitle };

function HeaderTitle() {
  const { projectName, projectNameIsCodeSnippet } = getFrame();
  if (!projectNameIsCodeSnippet) {
    return (
      <span
        style={{
          fontWeight: 700,
          marginLeft: 10,
          fontSize: "2.55em",
        }}
      >
        {projectName}
      </span>
    );
  }
  return (
    <code
      style={{
        backgroundColor: "#f4f4f4",
        borderRadius: 4,
        padding: "2px 5px",
        marginLeft: 10,
        fontSize: "1.55em",
      }}
    >
      {projectName}
    </code>
  );
}
