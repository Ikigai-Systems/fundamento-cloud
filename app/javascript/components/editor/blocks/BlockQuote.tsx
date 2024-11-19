import {createReactBlockSpec} from "@blocknote/react";
import "./blockQuote.css";
import {
	type CSSProperties, useEffect, useRef, useState,
} from 'react';

interface BlockQuoteTextareaProps {
	disabled: boolean;
	onChange: (value: string) => void;
	value: string;
}

function BlockQuoteTextarea({ disabled, onChange, value }: BlockQuoteTextareaProps) {
	const [height, setHeight] = useState<number>(0);
	const ref = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		const intervalId = setInterval(() => {
			const scrollHeight = ref.current?.scrollHeight;

			if (scrollHeight !== undefined && scrollHeight > 0) {
				setHeight(scrollHeight);
				clearInterval(intervalId);
			}
		}, 20);

		ref.current?.focus();

		return () => {
			clearInterval(intervalId);
		}
	}, []);

	useEffect(() => {
		setHeight(ref.current!.scrollHeight);
	}, [value])

	const style: CSSProperties = height > 0 ? {
		height: `${height}px`
	} : {};

	return (
		<textarea
			className={'block-quote-textarea'}
			disabled={disabled}
			onChange={(e) => onChange(e.target.value)}
			placeholder={'Enter your quote here'}
			ref={ref}
			rows={value ? undefined : 1}
			style={style}
			value={value}
		/>
	)
}

const BlockQuote = createReactBlockSpec({
	type: 'blockQuote',
	propSchema: {
		quoteText: {
			default: '',
		},
	},
	content: 'none',
}, {
	render: (props) => {
		return (
			<div className={'block-quote-container'}>
				<BlockQuoteTextarea
					disabled={!props.editor.isEditable}
					onChange={(quoteText) => {
						props.editor.updateBlock(props.block, {
							props: {
								quoteText,
							}
						})
					}}
					value={props.block.props.quoteText}
				/>
			</div>
		)
	}
})

export default BlockQuote;
