import React from "react";
import ReactDOM from "react-dom/client";

const RenderToString = (
	element: React.ReactElement
): Promise<string> =>
	new Promise((resolve) => {
		const container = document.createElement(`div`);
		const renderCallback = () => {
			resolve(container.firstElementChild?.innerHTML || ``);
		};

		ReactDOM.createRoot(container).render(
			<div ref={renderCallback}>{element}</div>
		);
	});


export default RenderToString