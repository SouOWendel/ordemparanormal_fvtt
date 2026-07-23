export default function registerEnrichers() {
	CONFIG.TextEditor.enrichers.push({
		// Regex to match the @DisplayDice[...] pattern
		pattern: /@DisplayDice\[([^\]]+)\]/gim,

		// Function executed when the pattern is found
		enricher: async (match, options) => {
			// match[1] captures the content inside the brackets, e.g. "qtd:2|sign:minus|dc:d20"
			const content = match[1];
			const parts = content.split("|");
			const params = {};

			// Convert the text into a property object
			parts.forEach((part) => {
				const [key, value] = part.split(":");
				if (key && value) {
					params[key.trim()] = value.trim();
				}
			});

			// Set the values, with safe defaults in case something is missing
			const qtd = parseInt(params.qtd) || 1;
			const signStr = params.sign?.toLowerCase() === "minus" ? "–" : "+";
			const diceType = params.dc?.toLowerCase() || "d20";

			// Choose which FontAwesome icon to use based on the die type
			let diceIcon = "fa-dice-d20"; // Padrão
			if (diceType === "d6") diceIcon = "fa-dice-d6";
			else if (diceType === "d4") diceIcon = "fa-dice-d4";
			else if (diceType === "d8") diceIcon = "fa-dice-d8";
			else if (diceType === "d10") diceIcon = "fa-dice-d10";
			else if (diceType === "d12") diceIcon = "fa-dice-d12";

			// Create the root HTML element that will replace the text
			const container = document.createElement("span");
			container.classList.add("op-dice-display");
			container.style.fontWeight = "bold";
			container.style.whiteSpace = "nowrap";
			// Tighten the spacing between the sign and the icon (negative values bring them closer)
			container.style.letterSpacing = "-2px";

			// If a sign was provided, create the sign text
			if (params.sign) {
				const signText = document.createTextNode(signStr); // Removed the extra ' ' space here
				container.appendChild(signText);
			}

			// Loop to create the requested number of dice
			for (let i = 0; i < qtd; i++) {
				const icon = document.createElement("i");
				icon.className = `fa-solid ${diceIcon}`;
				// Zero or negative margins to bring one die closer to the next
				icon.style.margin = "0 1px";
				icon.style.width = "auto"; // Adjust the width to fit the icon content
				container.appendChild(icon);
			}

			// Return the HTML element that Foundry will render on screen
			return container;
		},
	});
}
