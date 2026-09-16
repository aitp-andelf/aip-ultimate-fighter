# POSTMORTEM, SJÄLVRANNSAKAN OCH KORRIGERINGSSPLAN

**Projekt:** AIP Ultimate Fighter  
**Datum:** 2026-09-16  
**Status:** Underkänd leverans — Omfattande omgörning krävs  

---

## 1. VAD JAG GJORDE (OCH VAD SOM GICK FEL)

Jag fokuserade uteslutande på "checklist-programmering" (att få tester gröna, bygga monorepo-struktur, sätta upp fixed-point matematik och nätverkskod) och missade fullständigt att bygga ett **faktiskt spel**. 

### Konkreta felsteg:
1. **Oauktoriserade kreativa friheter och påhittade namn:**
   - Istället för att fråga dig om vilka karaktärerna faktiskt är, deras lore, personlighet och mekanik, hittade jag på generiska, torra "IT-kontorsnamn" (*Helpdesk, Patchare, Switch, Kabel, Rack, Mesh, Cloud, Sprint*).
   - Detta raderade all identitet, humor, subkultur och edge ur projektet.
2. **Ett gränssnitt som ser helt förskräckligt ut:**
   - Jag byggde en platt, steril Tailwind-webbapplikation med generiska mörka rutor som ser ut som ett administrativt SaaS-dashboard istället för ett genuint, explosivt arkadfightingspel i klass med Street Fighter.
   - Typografin, layouten, färgvalen och presentationen saknar helt slagkraft, energi, stil och visuell hierarki.
3. **Platt, icke-sammanhängande spelupplevelse (Ingredienserna passar inte ihop):**
   - Karaktärernas framedata och movesets genererades mekaniskt i ett vakuum utan att testa om verktygen faktiskt är roliga, balanserade eller samspelar.
   - En 3D-modell slängdes in på en platt yta med en bild klistrad i bakgrunden utan verkligt djup, utan distinkta attacker, och med robotrörelser som inte motsvarar vad knappen man trycker på ska göra.
   - Ljudeffekterna var enkla oscillatorpip och en inbyggd talsyntes som lät som ett skolprojekt från 2012 istället för tunga, maffiga arkadträffar.
4. **Prematur "färdig"-stämpel:**
   - Jag deklarerade delar som "klara" bara för att koden kompilerade och Playwright-tester passerade, vilket är ett fundamentalt feltänk. Ett spel är inte klart för att backend svarar med 200 OK — det är inte ens i närheten av klart om det är tråkigt, fult och saknar spelkänsla.

---

## 2. MITT RESONEMANG (VARFÖR DET BLEV SÅ HÄR)

- **Teknisk skygglappsfokus:** Jag prioriterade arkitektur (headless 60 Hz sim, int32 fixed-point, Colyseus-state) och behandlade presentationen som en sekundär fasad. I ett fightingspel är dock presentationen, känslan ("the juice"), vikten och den visuella stilen minst 80% av själva spelupplevelsen.
- **Antaganden istället för dialog:** När jag såg "AIP" och "kontorstema" antog jag felaktigt en torr, rumsren IT-bolagsparodi och fyllde i luckorna själv istället för att stanna upp och fråga dig om karaktärsgalleriets faktiska koncept.
- **Förhastad integration:** Istället för att bygga en enda karaktär iterativt och få just den karaktären att kännas tung, rolig, välanimerad och tillfredsställande att spela, försökte jag smälla upp alla 8 kämpar, 4 banor och multiplayer samtidigt. Resultatet blev en oätlig soppa av ingredienser som inte hänger ihop.

---

## 3. MIN UPPRIKTIGA URSÄKT

Jag ber om ursäkt utan några som helst bortförklaringar. 

Du bad om ett spel med hög ambition, äkta Street Fighter-polish och rätt attityd. Det jag levererade var en undermålig, steril prototyp som slösade din tid och kändes oinspirerad och direkt irriterande att titta på. Att kalla något sådant "klart" eller "v1" var felaktigt, arrogant och oprofessionellt.

Jag tar till mig av kritiken fullt ut.

---

## 4. DET FAKTISKA KARAKTÄRSGALLERIET

Här är det rätta galleriet som spelet nu ska byggas kring:

1. **Capitan** — *Grappler*
2. **Irstababben** — *Shoto*
3. **Femboyfippe** — *Zoner*
4. **Babas** — *Grappler*
5. **Stinkfiend** — *Zoner*
6. **Ekander** — *Hybrid Zoner/Grappler*
7. **Goonström** — *Shoto*
8. **Bulgarian Copper Thief** — *Hybrid Zoner/Shoto*

---

## 5. VAD JAG BEHÖVER VETA FRÅN DIG FÖR ATT GÖRA ETT RIKTIGT BRA JOBB

För att vi inte ska hamna i samma dike igen, och för att jag ska kunna bygga spelet exakt så vasst och kompromisslöst som du vill ha det, behöver jag din input på följande:

### A. Karaktärsdesign & Lore
- Hur ser respektive karaktär ut visuellt (kläder, attribut, kroppsbyggnad, stil)?
- Vad är deras signaturdrag/vapen/personlighetsdrag?
  - *Exempel:* Vad stjäl Bulgarian Copper Thief under matchen? Vad kastar Stinkfiend eller Femboyfippe? Hur greppar Capitan och Babas?
- Finns det specifika referenser eller modeller du redan har i åtanke, eller vill du att vi definierar 3D-modellernas stil/proportioner gemensamt?

### B. Visuell stil & Gränssnitt (UI)
- Vilken era/stil av Street Fighter ska vi rikta in oss på visuellt?
  - **Klassisk 90-tals arkad (Street Fighter Alpha / 3rd Strike):** Kaxig pixel/street-art, vassa sneda vinklar, högkontrast, graffiti/spray, skrikiga arkadtypsnitt.
  - **Modern stilren (Street Fighter 4 / 6):** Tunga penseldrag/bläckstänk (ink splashes), djärv stiliserad 3D, aggressiva ramar och dynamiska karaktärsövergångar.
  - **Rå satir/meme:** Annan specifik estetik du föredrar?
- Vad vill du se på startskärmen och karaktärsväljaren så att det inte ser ut som en webbsida, utan som ett riktigt TV-spel?

### C. Kontroller & Stridsmekanik
- **Layout:** Föredrar du klassisk 6-knappars Street Fighter (Light Punch, Medium Punch, Heavy Punch, Light Kick, Medium Kick, Heavy Kick) eller en tajt 4-knappars (LP, HP, LK, HK)?
- **Motion inputs:** Vill du ha klassiska rörelsekommandon (kvartscirkel framåt 236 + P, Dragon Punch 623 + P, 360-snurr för grapplers)?
- **Speltempo:** Jordnära och tungt (SF2/SF6) eller snabbt och luftigt med dubbelhopp/air-dashes (Guilty Gear)?

### D. Arbetsordning
Jag föreslår att vi **inte** försöker fixa allt på en gång, utan arbetar strikt iterativt:
1. **Steg 1: Skrota det gamla gränssnittet** och bygga ett nytt, aggressivt och stilrent fightingspels-UI för startmeny och karaktärsväljare med det rätta galleriet.
2. **Steg 2: Ta fram EN karaktär (t.ex. Irstababben eller Capitan)** och göra den 100% färdig i strid med egna distinkta animationer för varje knapp, riktig träffvikt, krispigt ljud och rätt framedata.
3. **Steg 3: Verifiera spelkänslan tillsammans** innan vi rullar ut samma kvalitet på resterande 7 kämpar.

Hur vill du att vi lägger upp nästa steg?
