import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"]
  ]
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "align",
  "indent",
  "list",
  "bullet",
  "blockquote",
  "code-block",
  "link"
];

export default function CampanhaDescricaoEditor({ value, onChange, placeholder }) {
  return (
    <div className="campanha-descricao-editor">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
