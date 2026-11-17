const colors=['크림','민트','라임','실버','코코아','라벤더','밤색','레몬','블루','살구','바닐라','초록'];
const animals=['토끼','여우','펭귄','곰','수달','참새','고양이','판다','다람쥐','고슴도치','강아지','오리'];
export const isNumberedGuest=name=>/^(손님|게스트)\s*\d{4}$/.test(String(name||''));
export function createGuestName(random=Math.random){return colors[Math.min(colors.length-1,Math.floor(random()*colors.length))]+animals[Math.min(animals.length-1,Math.floor(random()*animals.length))];}
