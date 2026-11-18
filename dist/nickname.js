// One visible-character rule for browser inputs and server validation (including emoji).
export const nicknameLimit=10;
const segmenter=new Intl.Segmenter('ko',{granularity:'grapheme'});
export const nicknameParts=value=>Array.from(segmenter.segment(String(value).normalize()),part=>part.segment);
export const cleanNickname=value=>String(value??'').normalize().replace(/[<>\u0000-\u001f\u007f]/g,'').trim();
export function validateNickname(value){const name=cleanNickname(value);if(!name||nicknameParts(name).length>nicknameLimit)throw Error('닉네임은 1~10자로 입력하세요.');return name;}
