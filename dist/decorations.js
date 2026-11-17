export const decorationCatalog={
 ball:{name:'볼',icon:'<circle cx="12" cy="14" r="7"/><path d="M10 7V3h4v4"/>'},
 heart:{name:'하트',icon:'<path d="M12 21 3 12C-2 5 7 0 12 7c5-7 14-2 9 5Z"/>'},
 star:{name:'별',icon:'<path d="m12 2 3 6 7 2-5 5 1 7-6-4-6 4 1-7-5-5 7-2Z"/>'},
 snowflake:{name:'눈송이',icon:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M8 4l4 3 4-3M8 20l4-3 4 3"/>'},
 gift:{name:'선물',icon:'<path d="M3 10h18v11H3ZM2 6h20v4H2Zm10 0v15M12 6C2 6 5-3 12 6c7-9 10 0 0 0Z"/>'},
 wreath:{name:'리스',icon:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><path d="m12 18-5 4 1-6m4 2 5 4-1-6"/>'},
 crystal:{name:'크리스털',icon:'<path d="m12 2 8 8-8 12-8-12Zm-8 8h16M12 2 8 10l4 12 4-12Z"/>'},
 bell:{name:'종',icon:'<path d="M5 17h14l-2-5V9a5 5 0 0 0-10 0v3Zm4 3q3 3 6 0M12 2v2"/>'},
 bow:{name:'리본',icon:'<path d="m10 10-7-5v12l7-4m4-3 7-5v12l-7-4m-4 1-3 8m7-8 3 8"/><circle cx="12" cy="12" r="2"/>'},
 moon:{name:'달',icon:'<path d="M18 3a9 9 0 1 0 3 15A10 10 0 0 1 18 3Z"/>'},
 letter:{name:'편지',icon:'<path d="M3 5h18v14H3Zm0 0 9 8 9-8"/>'},
 icicle:{name:'고드름',icon:'<path d="m8 3 8 0 2 5-6 14L6 8Zm-2 5h12M12 3v19"/>'}
};
export const decorationKinds=Object.keys(decorationCatalog);
export const decorationColors=['#ffd59a','#e5bb6b','#b8cfd1','#86bce1','#94495a','#cc6b73','#d7b5f0','#91dbc3','#f4e8de'];
export const decorationIcon=kind=>`<svg viewBox="0 0 24 24" aria-hidden="true">${(decorationCatalog[kind]||decorationCatalog.ball).icon}</svg>`;
export const validDecorationColor=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
