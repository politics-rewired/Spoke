import { green, grey, red } from "@material-ui/core/colors";
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
import React from "react";

import { replaceEasyGsmWins } from "../lib/charset-utils";
import { delimit, getMessageType, isAttachmentImage } from "../lib/scripts";
import baseTheme from "../styles/theme";
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
    color: green[500],
    direction: "ltr",
    unicodeBidi: "bidi-override"
  },
  badField: {
    color: red[400]
  },
  scriptFieldButton: {
    fontSize: "11px",
    color: green[600],
    textTransform: "none",
    backgroundColor: grey[100],
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
  integrationSourced: boolean;
  onChange: (value: string) => Promise<void> | void;
  receiveFocus?: boolean;
}

interface State {
  editorState: EditorState;
  validAttachment: boolean;
}

class ScriptEditor extends React.Component<Props, State> {
  private editorRef: Editor | null = null;

  constructor(props: Props) {
    super(props);

    const editorState = this.getEditorState();
    this.state = {
      editorState,
      validAttachment: true
    };
  }

  async componentDidMount() {
    if (this.props.receiveFocus === true) {
      const { editorState: oldState } = this.state;
      const editorState = EditorState.moveFocusToEnd(oldState);
      const text = editorState.getCurrentContent().getPlainText();
      const validAttachment = await isAttachmentImage(text);

      this.setState({
        editorState,
        validAttachment
      });
    }
  }

  UNSAFE_componentWillReceiveProps() {
    const { scriptFields } = this.props;
    const { editorState } = this.state;
    const decorator = this.getCompositeDecorator(scriptFields);
    EditorState.set(editorState, { decorator });

    // this.setState({ editorState: this.getEditorState() })
  }

  onEditorChange = async (editorState: EditorState) => {
    this.setState({ editorState }, () => {
      const { onChange } = this.props;
      if (onChange) {
        onChange(this.getValue());
      }
    });

    const text = editorState.getCurrentContent().getPlainText();
    const validAttachment = await isAttachmentImage(text);

    this.setState({ validAttachment });
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

  renderAttachmentWarning() {
    const text = this.state.editorState.getCurrentContent().getPlainText();
    const messageType = getMessageType(text);
    if (messageType === "MMS" && !this.state.validAttachment) {
      return (
        <div style={{ color: baseTheme.colors.red }}>
          WARNING! The media attachment URL is of an unsupported MMS type.
          Please check the URL of the attachment or see{" "}
          <a
            href="https://docs.spokerewired.com/article/86-include-an-image-in-a-message"
            target="_blank"
            rel="noopener noreferrer"
          >
            Include an Image in a Message
          </a>{" "}
          for all supported types.
        </div>
      );
    }
  }

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
    const messageType = getMessageType(text);

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
        {this.props.integrationSourced && (
          <p>
            <span style={{ color: "black" }}>Note:</span> these fields are
            provided by an integration and are not all guaranteed to contain
            values for all contacts.
          </p>
        )}
        {this.renderCustomFields()}
        <div>
          {this.renderAttachmentWarning()}
          <br />
          Estimated Segments: {info.msgCount} <br />
          Characters left in current segment:{" "}
          {info.msgCount * info.charsPerSegment - info.charCount}
          <br />
          Encoding required: {info.encoding} <br />
          Message Type: {messageType} <br />
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
