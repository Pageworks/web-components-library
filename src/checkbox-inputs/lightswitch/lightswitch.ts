class LightswitchComponent extends HTMLElement
{
	connectedCallback()
	{
		console.log('lightswitch component has been connected.');
	}
}

customElements.define('lightswitch-component', LightswitchComponent);
