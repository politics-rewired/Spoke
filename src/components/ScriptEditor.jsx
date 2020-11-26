import PropTypes from "prop-types";
import React from "react";
import {
  EditorState,
  ContentState,
  CompositeDecorator,
  Editor,
  Modifier
} from "draft-js";
import escapeRegExp from "lodash/escapeRegExp";
import { delimit } from "../lib/scripts";
import Chip from "./Chip";
import { red400, green500, green600, grey100 } from "material-ui/styles/colors";
import { getCharCount } from "@trt2/gsm-charset-utils";

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

function findWithRegex(regex, contentBlock, callback) {
  const text = contentBlock.getText();
  let matchArr = regex.exec(text);
  let start;
  while (matchArr !== null) {
    start = matchArr.index;
    callback(start, start + matchArr[0].length);
    matchArr = regex.exec(text);
  }
}

const RecognizedField = props => (
  <span {...props} style={styles.goodField}>
    {props.children}
  </span>
);

RecognizedField.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element)
};

const UnrecognizedField = props => (
  <span {...props} style={styles.badField}>
    {props.children}
  </span>
);

UnrecognizedField.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element)
};

const gsmReplacements = [
  ["‘", "'"],
  ["’", "'"],
  ["”", '"'],
  ["”", '"'],
  ["“", '"'],
  ["–", "-"]
];

const replaceEasyGsmWins = text =>
  gsmReplacements.reduce(
    (acc, replacement) => acc.replace(replacement[0], replacement[1]),
    text
  );

class ScriptEditor extends React.Component {
  constructor(props) {
    super(props);

    const editorState = this.getEditorState();
    this.state = {
      editorState
    };
  }

  componentWillReceiveProps() {
    const { scriptFields } = this.props;
    const { editorState } = this.state;
    const decorator = this.getCompositeDecorator(scriptFields);
    EditorState.set(editorState, { decorator });

    // this.setState({ editorState: this.getEditorState() })
  }

  focus = () => this.refs.editor.focus();

  onEditorChange = editorState => {
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

  getCompositeDecorator(scriptFields) {
    const recognizedFieldStrategy = (contentBlock, callback) => {
      const regex = new RegExp(
        `\{(${scriptFields.map(escapeRegExp).join("|")})\}`,
        "g"
      );
      return findWithRegex(regex, contentBlock, callback);
    };

    const unrecognizedFieldStrategy = (contentBlock, callback) =>
      findWithRegex(/\{[^{]*\}/g, contentBlock, callback);

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
  }

  addCustomField = field => {
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
        {scriptFields.map(field => (
          <Chip
            key={field}
            style={styles.scriptFieldButton}
            text={delimit(field)}
            onTouchTap={() => this.addCustomField(field)}
          />
        ))}
      </div>
    );
  }

  render() {
    const { name } = this.props;

    const text = this.state.editorState.getCurrentContent().getPlainText();
    const info = getCharCount(replaceEasyGsmWins(text));

    return (
      <div>
        <div style={styles.editor} onClick={this.focus}>
          <Editor
            name={name}
            editorState={this.state.editorState}
            onChange={this.onEditorChange}
            ref="editor"
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
          >
            docs here
          </a>.
        </div>
      </div>
    );
  }
}

ScriptEditor.propTypes = {
  name: PropTypes.string.isRequired,
  scriptText: PropTypes.string.isRequired,
  scriptFields: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ScriptEditor;
