import React from "react";

export default function QuestionCard({ question, selectedAnswer, onSelect }) {
  return (
    <div className="card card-clean p-4">
      <h5 className="mb-3">Q: {question.questionText}</h5>
      <div>
        {question.options.map((opt, idx) => {
          const checked = selectedAnswer === opt;
          return (
            <div className="form-check mb-2" key={idx}>
              <input
                id={`opt-${idx}`}
                className="form-check-input"
                type="radio"
                name="option"
                checked={checked}
                onChange={() => onSelect(opt)}
              />
              <label className="form-check-label" htmlFor={`opt-${idx}`}>
                {opt}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
