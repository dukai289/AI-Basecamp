import React from "react";
import OriginalDocItemLayout from "@theme-original/DocItem/Layout";
import {useDoc} from "@docusaurus/plugin-content-docs/client";

export default function DocItemLayoutWrapper(props) {
  const {frontMatter} = useDoc();
  const pageClassName = frontMatter.page_class;

  if (!pageClassName) {
    return <OriginalDocItemLayout {...props} />;
  }

  return (
    <div className={pageClassName}>
      <OriginalDocItemLayout {...props} />
    </div>
  );
}
