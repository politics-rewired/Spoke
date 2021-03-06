import { getCharCount } from "@trt2/gsm-charset-utils";
import {
  CompositeDecorator,
  ContentBlock,
  ContentState,
  Editor,
  EditorState,
  Modifier
} from "draft-js";
import escapeRegExp from "lodash/escapeRegExp";
import { green500, green600, grey100, red400 } from "material-ui/styles/colors";
import React from "react";

import { replaceEasyGsmWins } from "../lib/charset-utils";
import { delimit } from "../lib/scripts";
import Chip from "./Chip";

type DecoratorStrategyCallBack = (start: number, end: number) => void;

type DecoratorStrategy = (
  block: ContentBlock,
  callback: DecoratorStrategyCallBack,
  contentState: ContentState
) => void;

const styles = {
  editor: {
    border: "1px solid #ddd",
    cursor: "text",
    fontSize: 16,
    padding: 5
  },
  button: {
    marginTop: 10,
    textAlign: "center"
  },
  goodField: {
    color: green500,
    direction: "ltr",
    unicodeBidi: "bidi-override"
  },
  badField: {
    color: red400
  },
  scriptFieldButton: {
    fontSize: "11px",
    color: green600,
    textTransform: "none",
    backgroundColor: grey100,
    // margin: '5px 10px',
    cursor: "pointer"
    // display: 'inline-block',
  },
  scriptFieldButtonSection: {
    marginTop: 10,
    padding: 5
  }
};

function findWithRegex(
  regex: RegExp,
  contentBlock: ContentBlock,
  callback: DecoratorStrategyCallBack
) {
  const text = contentBlock.getText();
  let matchArr = regex.exec(text);
  let start;
  while (matchArr !== null) {
    start = matchArr.index;
    callback(start, start + matchArr[0].length);
    matchArr = regex.exec(text);
  }
}

const RecognizedField: React.FC = (props) => (
  <span {...props} style={styles.goodField}>
    {props.children}
  </span>
);

const UnrecognizedField: React.FC = (props) => (
  <span {...props} style={styles.badField}>
    {props.children}
  </span>
);

interface Props {
  scriptText: string;
  scriptFields: string[];
  onChange: (value: string) => Promise<void> | void;
  receiveFocus?: boolean;
}

interface State {
  editorState: EditorState;
}

class ScriptEditor extends React.Component<Props, State> {
  private editorRef: Editor | null = null;

  constructor(props: Props) {
    super(props);

    const editorState = this.getEditorState();
    this.state = {
      editorState
    };
  }

  componentDidMount() {
    if (this.props.receiveFocus === true) {
      const { editorState: oldState } = this.state;
      const editorState = EditorState.moveFocusToEnd(oldState);
      this.setState({ editorState });
    }
  }

  UNSAFE_componentWillReceiveProps() {
    const { scriptFields } = this.props;
    const { editorState } = this.state;
    const decorator = this.getCompositeDecorator(scriptFields);
    EditorState.set(editorState, { decorator });

    // this.setState({ editorState: this.getEditorState() })
  }

  onEditorChange = (editorState: EditorState) => {
    this.setState({ editorState }, () => {
      const { onChange } = this.props;
      if (onChange) {
        onChange(this.getValue());
      }
    });
  };

  getEditorState() {
    const { scriptFields, scriptText } = this.props;

    const decorator = this.getCompositeDecorator(scriptFields);
    let editorState;
    if (scriptText) {
      editorState = EditorState.createWithContent(
        ContentState.createFromText(scriptText),
        decorator
      );
    } else {
      editorState = EditorState.createEmpty(decorator);
    }

    return editorState;
  }

  getValue() {
    const { editorState } = this.state;
    return replaceEasyGsmWins(editorState.getCurrentContent().getPlainText());
  }

  getCompositeDecorator = (scriptFields: string[]) => {
    const recognizedFieldStrategy: DecoratorStrategy = (
      contentBlock,
      callback
    ) => {
      const regex = new RegExp(
        `{(${scriptFields.map(escapeRegExp).join("|")})}`,
        "g"
      );
      return findWithRegex(regex, contentBlock, callback);
    };

    const unrecognizedFieldStrategy: DecoratorStrategy = (
      contentBlock,
      callback
    ) => findWithRegex(/\{[^{]*\}/g, contentBlock, callback);

    return new CompositeDecorator([
      {
        strategy: recognizedFieldStrategy,
        component: RecognizedField
      },
      {
        strategy: unrecognizedFieldStrategy,
        component: UnrecognizedField
      }
    ]);
  };

  focus = () => {
    if (this.editorRef) {
      this.editorRef.focus();
    }
  };

  addCustomField = (field: string) => {
    const textToInsert = delimit(field);
    const { editorState } = this.state;
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const newContentState = Modifier.insertText(
      contentState,
      selection,
      textToInsert
    );
    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      "insert-fragment"
    );
    this.setState({ editorState: newEditorState }, this.focus);
  };

  renderCustomFields() {
    const { scriptFields } = this.props;
    return (
      <div style={styles.scriptFieldButtonSection}>
        {scriptFields.map((field) => (
          <Chip
            key={field}
            style={styles.scriptFieldButton}
            text={delimit(field)}
            onClick={() => this.addCustomField(field)}
          />
        ))}
      </div>
    );
  }

  render() {
    const text = this.state.editorState.getCurrentContent().getPlainText();
    const info = getCharCount(replaceEasyGsmWins(text));

    return (
      <div>
        <div style={styles.editor} onClick={this.focus}>
          <Editor
            editorState={this.state.editorState}
            onChange={this.onEditorChange}
            ref={(el) => {
              this.editorRef = el;
            }}
            spellCheck
          />
        </div>
        {this.renderCustomFields()}
        <div>
          <br />
          Estimated Segments: {info.msgCount} <br />
          Characters left in current segment:{" "}
          {info.msgCount * info.charsPerSegment - info.charCount}
          <br />
          Encoding required: {info.encoding} <br />
          <br />
          Not sure what a segment is? Check out the{" "}
          <a
            href="https://docs.spokerewired.com/article/89-segments-and-encodings"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs here
          </a>
          .
        </div>
      </div>
    );
  }
}

export default ScriptEditor;
