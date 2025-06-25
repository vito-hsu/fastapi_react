// src/components/NoteList.js

import React from "react";
import NoteItem from "./NoteItem";

function NoteList({ notes, onEditNote, onDeleteNote }) {
  if (!notes || notes.length === 0) {
    return <p style={{ textAlign: "center", marginTop: "50px", fontSize: "1.2em", color: "#777" }}>目前沒有筆記，快來新增一條吧！</p>;
  }

  return (
    <div className="note-list">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          onEdit={onEditNote}
          onDelete={onDeleteNote}
        />
      ))}
    </div>
  );
}

export default NoteList;