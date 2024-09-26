import React, { useState, useEffect, useRef } from 'react';
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
  SandpackConfig,
  MDXEditorMethods
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { dialog, fs } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';
import { writeTextFile } from '@tauri-apps/api/fs';
import { debounce } from 'lodash'; 

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
  const [filePath, setFilePath] = useState<string | null>(null);
  const editorRef = useRef<MDXEditorMethods>(null);
  const saveFile = async (content: string) => {
    try {
      await writeTextFile(filePath!, content);
      console.log('File saved successfully');

      setSaveNotification(true);
      setTimeout(() => setSaveNotification(false), 5000);
        
      
    } catch (error) {
      console.error('Failed to save file', error);
    }
  };
  const debouncedSave = debounce(saveFile, 1000); // 1秒后自动保存
  const [saveNotification, setSaveNotification] = useState(false);


  // 选择文件并读取内容的函数
  const selectFile = async () => {
    try {
      const selected = await dialog.open({
        filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
      });

      if (selected && typeof selected === 'string') {
        const fileContent = await fs.readTextFile(selected);
        // 设置 Markdown 内容到编辑器中
        setMarkdown(fileContent);
        setFilePath(selected);
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

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setMarkdown(markdown);
    }
  }, [markdown]);

  useEffect(() => {
    if (markdown && filePath) {
      debouncedSave(markdown);
    }
  }, [markdown]);



  return (
    <div style={{marginLeft: '100px', marginRight: '100px'}}>
      {saveNotification && (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 128, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        transition: 'opacity 0.5s',
        opacity: saveNotification ? 1 : 0,
      }}>
        已自动保存
      </div>
    )}
      <MDXEditor
        ref={editorRef}
        markdown={markdown} // 确保 markdown 状态被正确传递
        onChange={(content) => {
          console.log("MDXEditor content changed:", content);
          setMarkdown(content);
        }}
        onError={(error) => {
          console.error("MDXEditor error:", error);
        }}
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
