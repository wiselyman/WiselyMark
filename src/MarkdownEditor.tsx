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
  const supportedLanguages = {
    text: 'Plain Text',
    js: 'JavaScript',
    jsx: 'JavaScript JSX',
    ts: 'TypeScript',
    tsx: 'TypeScript JSX',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    cs: 'C#',
    ruby: 'Ruby',
    php: 'PHP',
    go: 'Go',
    rust: 'Rust',
    swift: 'Swift',
    kotlin: 'Kotlin',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    yaml: 'YAML',
    markdown: 'Markdown',
    sql: 'SQL',
    bash: 'Bash',
    powershell: 'PowerShell'
  };
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

  const createNewFile = async () => {
    const newFileName = `default.md`;
    const newFilePath = await dialog.save({
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      defaultPath: newFileName
    });

    if (newFilePath) {
      const initialContent = '# New Markdown File\n\nStart writing here...';
      await writeTextFile(newFilePath, initialContent);
      setMarkdown(initialContent);
      setFilePath(newFilePath);
    }
  };

  useEffect(() => {
    const unlistenOpenFile = listen('menu-open-file', () => {
      selectFile();
    });

    const unlistenNewFile = listen('menu-new-file', () => {
      createNewFile();
    });

    return () => {
      unlistenOpenFile.then(fn => fn());
      unlistenNewFile.then(fn => fn());
    };
  }, []);

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
          codeBlockPlugin({defaultCodeBlockLanguage: 'text'}),
          sandpackPlugin({ sandpackConfig: reactSandpackConfig}),
          codeMirrorPlugin({ codeBlockLanguages: supportedLanguages}),
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
