import React, { useState, useEffect } from 'react';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  codeBlockPlugin,
  imagePlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  sandpackPlugin,
  codeMirrorPlugin,
  SandpackConfig
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { dialog, fs } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';

const defaultSnippetContent = `
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`.trim();

const reactSandpackConfig: SandpackConfig = {
    defaultPreset: "react",
    presets: [
      {
        label: "React",
        name: "react",
        meta: "live",
        sandpackTemplate: "react",
        sandpackTheme: "light",
        snippetFileName: "/App.js",
        snippetLanguage: "jsx",
        initialSnippetContent: defaultSnippetContent,
      },
    ],
  };

function App() {
  const [markdown, setMarkdown] = useState<string>('# Hello World');

  // 选择文件并读取内容的函数
  const selectFile = async () => {
    try {
      const selected = await dialog.open({
        filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
      });

      if (selected && typeof selected === 'string') {
        const fileContent = await fs.readTextFile(selected);
        
        // 打印读取的文件内容
        console.log("File Content Read: ", fileContent);

        // 设置 Markdown 内容到编辑器中
        setMarkdown(fileContent);
      }
    } catch (error) {
      console.error('Failed to read file', error);
    }
  };

  // 监听从系统菜单发送的事件
  useEffect(() => {
    const unlisten = listen('menu-open-file', () => {
      selectFile(); // 当菜单项被点击时，调用选择文件的函数
    });

    // 清理事件监听器
    return () => {
      unlisten.then((dispose) => dispose());
    };
  }, []);

  // 当 markdown 状态变化时，打印其新值
  useEffect(() => {
    console.log("Markdown State Updated: ", markdown);
  }, [markdown]);

  return (
    <div>
      <h1>Markdown Editor</h1>
      <MDXEditor
        markdown={markdown} // 确保 markdown 状态被正确传递
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          codeBlockPlugin({defaultCodeBlockLanguage: 'js'}),
          sandpackPlugin({ sandpackConfig: reactSandpackConfig }),
          codeMirrorPlugin({ codeBlockLanguages: { java: 'Java', js: 'JavaScript', css: 'CSS' } }),
          imagePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          markdownShortcutPlugin()
        ]}
      />
    </div>
  );
}

export default App;
