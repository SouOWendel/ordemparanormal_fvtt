export class OrdemTokenDocument extends foundry.documents.TokenDocument {
	_onRelatedUpdate(update = {}, operation = {}) {
		super._onRelatedUpdate(update, operation);
		if (this.rendered) this.object?.renderFlags.set({ refreshBars: true, refreshState: true });
	}
}
