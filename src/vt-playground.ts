import {LitElement, html, nothing} from 'lit';
import styles from './styles.css' assert {type: 'css'};
import manifest from '../package.json' assert {type: 'json'};
import {customElement, property, state} from 'lit/decorators.js';
import {createRef, ref} from 'lit/directives/ref.js';
import {classMap} from 'lit/directives/class-map.js';
import {join} from 'lit/directives/join.js';
import {basicSetup, EditorView} from 'codemirror';
import {javascript} from '@codemirror/lang-javascript';
import stringifyObject from 'stringify-object';

const API_URL = 'https://api.val.town';
const SANDBOX_URL = `https://cdn.jsdelivr.net/npm/vt-playground@${manifest.version}/sandbox.ts`;

type LogType = {
  level: string;
  args: unknown[];
};

type EvalResponse = {
  json:
    | {
        ok: true;
        logs: LogType[];
      }
    | {
        ok: false;
        error: string;
      };
};

const playIcon = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  stroke-width="1.5"
  stroke="currentColor"
  aria-hidden="true"
  class="h-4 w-4"
>
  <path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
  ></path>
</svg>`;

const valtownLogo = html`<svg
  class="h-8"
  viewBox="0 0 600 237"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <rect width="600" height="237" fill="white" />
  <g clip-path="url(#clip0_1045_720)">
    <path
      d="M171.182 146.387C175.072 146.387 178.246 145.305 180.706 143.139C183.165 140.975 184.395 138.093 184.395 134.495V133.394H170.411C167.841 133.394 165.822 133.945 164.355 135.046C162.885 136.147 162.153 137.688 162.153 139.67C162.153 141.652 162.924 143.268 164.465 144.515C166.007 145.764 168.245 146.387 171.182 146.387ZM168.76 157.618C164.867 157.618 161.382 156.939 158.299 155.581C155.216 154.224 152.775 152.242 150.977 149.635C149.177 147.031 148.279 143.855 148.279 140.111C148.279 136.367 149.177 133.229 150.977 130.696C152.775 128.164 155.271 126.256 158.464 124.971C161.657 123.687 165.308 123.044 169.42 123.044H184.395V119.961C184.395 117.392 183.586 115.281 181.973 113.629C180.357 111.978 177.788 111.152 174.265 111.152C170.814 111.152 168.245 111.942 166.557 113.519C164.867 115.099 163.766 117.136 163.254 119.63L150.481 115.336C151.362 112.547 152.775 109.996 154.72 107.683C156.664 105.371 159.271 103.5 162.538 102.068C165.804 100.637 169.786 99.921 174.485 99.921C181.678 99.921 187.368 101.721 191.552 105.316C195.736 108.914 197.828 114.125 197.828 120.952V141.322C197.828 143.524 198.856 144.626 200.911 144.626H205.315V156.077H196.067C193.35 156.077 191.111 155.416 189.35 154.095C187.588 152.773 186.707 151.012 186.707 148.809V148.7H184.615C184.321 149.58 183.661 150.737 182.633 152.168C181.604 153.599 179.991 154.866 177.788 155.967C175.586 157.068 172.575 157.618 168.76 157.618Z"
      fill="black"
    />
    <path d="M228.217 78.999H214.343V156.076H228.217V78.999Z" fill="black" />
    <path
      d="M290.318 156.077C286.721 156.077 283.802 154.958 281.564 152.719C279.324 150.481 278.206 147.488 278.206 143.745V112.914H264.552V101.462H278.206V84.505H292.079V101.462H307.055V112.914H292.079V141.322C292.079 143.524 293.107 144.626 295.163 144.626H305.733V156.077H290.318Z"
      fill="black"
    />
    <path
      d="M342.51 145.286C346.767 145.286 350.29 143.91 353.081 141.157C355.87 138.404 357.265 134.459 357.265 129.32V128.219C357.265 123.082 355.888 119.135 353.135 116.382C350.383 113.629 346.84 112.253 342.51 112.253C338.252 112.253 334.729 113.629 331.939 116.382C329.149 119.135 327.755 123.082 327.755 128.219V129.32C327.755 134.459 329.149 138.404 331.939 141.157C334.729 143.91 338.252 145.286 342.51 145.286ZM342.51 157.618C337.077 157.618 332.196 156.517 327.865 154.315C323.533 152.113 320.12 148.919 317.625 144.735C315.129 140.551 313.881 135.524 313.881 129.65V127.888C313.881 122.017 315.129 116.988 317.625 112.803C320.12 108.619 323.533 105.426 327.865 103.224C332.196 101.022 337.077 99.921 342.51 99.921C347.942 99.921 352.823 101.022 357.155 103.224C361.485 105.426 364.898 108.619 367.395 112.803C369.89 116.988 371.139 122.017 371.139 127.888V129.65C371.139 135.524 369.89 140.551 367.395 144.735C364.898 148.919 361.485 152.113 357.155 154.315C352.823 156.517 347.942 157.618 342.51 157.618Z"
      fill="black"
    />
    <path
      d="M385.901 148.327L379.287 101.462H393.05L397.895 146.717H399.877L405.738 109.085C406.421 104.697 410.199 101.462 414.639 101.462H421.452C425.892 101.462 429.67 104.697 430.353 109.085L436.214 146.717H438.196L443.041 101.462H456.804L450.19 148.327C449.563 152.772 445.759 156.077 441.27 156.077H433.798C429.358 156.077 425.58 152.841 424.897 148.454L419.037 110.821H417.054L411.194 148.454C410.511 152.841 406.733 156.077 402.293 156.077H394.821C390.332 156.077 386.528 152.772 385.901 148.327Z"
      fill="black"
    />
    <path
      d="M467.815 156.077V101.462H481.469V108.62H483.451C484.332 106.711 485.983 104.895 488.405 103.169C490.828 101.446 494.498 100.582 499.417 100.582C503.673 100.582 507.399 101.556 510.593 103.5C513.786 105.445 516.263 108.124 518.025 111.537C519.786 114.951 520.667 118.934 520.667 123.484V156.077H506.794V124.585C506.794 120.476 505.784 117.392 503.766 115.336C501.746 113.282 498.866 112.253 495.122 112.253C490.864 112.253 487.561 113.668 485.212 116.492C482.862 119.319 481.689 123.264 481.689 128.329V156.077H467.815Z"
      fill="black"
    />
    <path
      d="M134.934 101.463L108.115 145.947H106.133V109.185C106.133 104.92 102.676 101.463 98.4109 101.463H92.2599V147.069C92.2599 152.044 96.2929 156.078 101.268 156.078H111.275C115.918 156.078 120.209 153.601 122.532 149.581L150.332 101.463H134.934Z"
      fill="black"
    />
    <path d="M79 101.458H92.903V112.91H79V101.458Z" fill="black" />
  </g>
  <defs>
    <clipPath id="clip0_1045_720">
      <rect width="442" height="79" fill="white" transform="translate(79 79)" />
    </clipPath>
  </defs>
</svg> `;

@customElement('vt-playground')
export class Playground extends LitElement {
  static override styles = [styles];

  @property({type: String})
  val = '';

  editorRef = createRef();
  view: EditorView | undefined;

  @property({attribute: false})
  logs: LogType[] = [];

  override async firstUpdated() {
    let initialText =
      'import {capitalize} from "npm:lodash-es"\n\nconsole.log(capitalize("hello from val"))';
    if (this.val) {
      const resp = await fetch(`https://api.val.town/v1/alias/${this.val}`);
      if (!resp.ok) {
        initialText = `// Error: ${resp.status} ${resp.statusText}`;
      }
      const {code} = await resp.json();
      initialText = code;
    } else if (this.textContent) {
      console.log('textContent', this.textContent);
      initialText = trimLeadingWS(this.textContent);
    }

    this.view = new EditorView({
      doc: initialText,
      extensions: [basicSetup, javascript()],
      parent: this.editorRef.value!
    });
  }

  get code() {
    return this.view?.state.doc.toString() || '';
  }

  async run() {
    this.logs = [];
    this.requestUpdate();
    const resp = await fetch(API_URL + '/v1/eval', {
      method: 'POST',
      body: JSON.stringify({
        code: `async (code) => await(await import(${JSON.stringify(
          SANDBOX_URL
        )})).serializedExecute(code)`,
        args: [this.code]
      })
    });
    const res = (await resp.json()) as EvalResponse;
    console.log(res);
    if (res.json.ok) {
      this.logs = res.json.logs;
    } else {
      this.logs = [
        {
          level: 'error',
          args: [res.json.error]
        }
      ];
    }
    // Why do we need to call requestUpdate here?
    this.requestUpdate();
  }

  async save() {
    window.open(`https://val.town/new?code=${encodeURIComponent(this.code)}`);
  }

  override render() {
    return html`<div
      class="group overflow-hidden rounded border border-gray-300 bg-white shadow-sm ring-4 ring-sky-500/0 transition-colors [&:has(.cm-focused)]:border-gray-400 [&:has(.cm-focused)]:ring-sky-500/10"
    >
      <div class="divide-y divide-gray-300">
        <div
          class="flex w-full select-none flex-row justify-between gap-x-1 space-y-0 px-2 py-1 text-gray-600"
        >
          <div class="flex items-center justify-start gap-x-1">
            <a href="https://val.town" target="_blank">${valtownLogo}</a>
          </div>
          <div class="flex gap-x-1">
            <vt-button @click=${() => this.save()}>Save</vt-button>
            <vt-button primary @click=${() => this.run()}
              >${playIcon} Run</vt-button
            >
          </div>
        </div>
        <div class="relative" ${ref(this.editorRef)}></div>
        ${this.logs.length > 0
          ? html`<div>
              ${this.logs.map((log) => html`<vt-log .log=${log}></vt-log>`)}
            </div>`
          : nothing}
      </div>
    </div>`;
  }
}

@customElement('vt-button')
export class Header extends LitElement {
  static override styles = [styles];
  @property({type: Boolean})
  primary = false;

  render() {
    return html`
      <button
        class="font-regular ${classMap({
          'text-white bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600':
            this.primary,
          'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400':
            !this.primary
        })} group inline-flex h-min select-none items-center justify-center gap-x-1 whitespace-nowrap rounded border p-1.5 outline-0 transition-colors transition-shadow focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-1 enabled:cursor-pointer disabled:cursor-not-allowed disabled:text-gray-400"
      >
        <slot></slot>
      </button>
    `;
  }
}

@customElement('vt-log')
export class Log extends LitElement {
  static override styles = [styles];

  @property({type: Object})
  log: LogType | undefined;

  @state()
  open = false;

  render() {
    return html`<details
      ${this.open ? 'open' : ''}
      class="
    ${classMap({
        'bg-white hover:bg-blue-50 open:bg-blue-50':
          this.log?.level !== 'error' && this.log?.level !== 'warn',
        'bg-red-100 hover:bg-red-200 open:bg-red-200':
          this.log?.level === 'error',
        'bg-yellow-100 hover:bg-yellow-200 open:bg-yellow-200':
          this.log?.level === 'warn'
      })} group relative"
    >
      <summary
        class="
    [&amp;::-webkit-details-marker]:hidden
    top-0 isolate grid w-full items-center gap-2 px-2 py-[4px]
            text-left
            font-mono
            text-xs
            transition-colors
            "
        style="grid-template-columns: 20px minmax(0px, 1fr)"
      >
        <div class="p-0.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            @click=${() => (this.open = !this.open)}
            fill="currentColor"
            aria-hidden="true"
            class="w-3 text-blue-500 transition-transform group-open:rotate-90"
          >
            <path
              fill-rule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </div>
        <div class="truncate">${log(...(this.log?.args || []))}</div>
      </summary>
      <div>
        <div class="px-5 py-2 font-mono text-xs">
          ${logPretty(...(this.log?.args || []))}
        </div>
      </div>
    </details>`;
  }
}

export function log(...args: unknown[]) {
  return args
    .map((arg) => {
      if (typeof arg === 'string') {
        return arg;
      }
      return stringifyObject(arg);
    })
    .join(' ');
}

export function logPretty(...args: unknown[]) {
  return join(
    args.map((arg) => {
      if (typeof arg === 'string') {
        return arg;
      }
      return stringifyObject(arg, {indent: '  '});
    }),
    html`<br />`
  );
}

function trimLeadingWS(code: string) {
  /*
    Get the initial indentation
    But ignore new line characters
  */
  var matcher = /^[\r\n]+(\s+)/m;
  const match = code.match(matcher);
  if (match) {
    console.log('matching');
    /*
      Replace the initial whitespace
      globally and over multiple lines
    */
    return code.trim().replace(new RegExp('^' + match[1], 'gm'), '');
  }

  console.log('not matching');
  // Regex doesn't match so return the original string
  return code.trim();
}