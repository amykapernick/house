import { ReactElement } from "react";
import RenderToString from "./RenderToString";
import { useEffect, useState } from 'react';

type renderToStringProps = [
	input: ReactElement | ReactElement[],
	deps?: any[]
]

const renderToString = (...props: renderToStringProps) => {
	const [input, deps = []] = props
	const [htmlStringList, setHtmlStringList] = useState<string[]>([]);
	const elementList = Array.isArray(input) ? input : [input];

	useEffect(() => {
		(async () => {
			const markupPromises = elementList.map(RenderToString);
			const markup: string[] = await Promise.all(markupPromises);

			if (!setHtmlStringList) {
				return;
			}

			setHtmlStringList(markup);
		})();
	}, deps);

	return htmlStringList;
};

export default renderToString