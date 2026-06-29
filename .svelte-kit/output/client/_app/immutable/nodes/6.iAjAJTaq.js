import{A as e,B as t,C as n,E as r,F as i,G as a,H as o,I as s,L as c,Q as l,S as u,T as d,U as f,W as p,X as m,Y as h,Z as g,a as _,b as v,d as y,h as b,lt as x,nt as S,q as C,rt as w,u as T,v as E,w as D,x as O,y as k}from"../chunks/Bo5XAPB2.js";import"../chunks/xihTtKlq.js";import{i as A}from"../chunks/C-BqhzwM.js";import{t as j}from"../chunks/CPPgzChO.js";var M={fan:{size:[150,150]},light:{size:[30,30]},fan_light:{size:[150,150]},aircon:{size:[100,50]},tv:{size:[100,50]},fan_pedestol:{size:[50,50]},oven:{size:[50,100]},washing_machine:{size:[100,100]},bed:{size:[30,30]},fridge:{size:[200,250]},fire:{size:[200,100]},switch_light:{size:[30,30]},wifi_router:{size:[30,30]},robot_vacuum:{size:[50,50]},lamp:{size:[30,30]},computer:{size:[30,30]},laptop:{size:[100,50]},pi:{size:[30,30]},monitor:{size:[50,50]},camera:{size:[30,30]},alarm:{size:[30,30]},speaker:{size:[30,30]},doorbell:{size:[30,30]}},N=d(`<g class="area svelte-y3dgyx"><a target="_blank"><rect class="space svelte-y3dgyx" rx="0" ry="0"></rect><text class="label svelte-y3dgyx"> </text></a></g>`),P=D(`<a class="item svelte-y3dgyx"><span class="item-label svelte-y3dgyx"> </span> <span class="sr-only"> </span></a>`),F=D(`<li class="stat svelte-y3dgyx"><!></li>`),I=D(`<ul class="info svelte-y3dgyx"></ul>`),L=D(`<div class="container svelte-y3dgyx"><svg class="map svelte-y3dgyx" fill="none"></svg> <!> <!></div>`);function R(t,i){w(i,!0);let a=_(i,`areas`,19,()=>[]),c=_(i,`items`,19,()=>[]),l=[1189,1593];var d=L(),h=o(d);E(h,21,a,k,(t,n)=>{var r=N(),i=o(r),a=o(i),c=p(a),l=o(c,!0);x(c),x(i),x(r),s(()=>{y(r,`--colour: var(--${e(n).colour??`primary`??``})`),T(i,`href`,e(n).link),T(a,`x`,e(n).start[0]),T(a,`y`,e(n).start[1]),T(a,`width`,e(n).size[0]),T(a,`height`,e(n).size[1]),T(c,`x`,e(n).start[0]+10),T(c,`y`,e(n).start[1]+40),O(l,e(n).name)}),u(t,r)}),x(h);var g=p(h,2);E(g,17,c,k,(t,n)=>{let r=m(()=>e(n).size??M[e(n).type]?.size??[30,30]);var i=P(),a=o(i),c=o(a,!0);x(a);var d=p(a,2),f=o(d);x(d),x(i),s(t=>{T(i,`href`,e(n).link),y(i,`--width: ${e(r)[0]/l[0]*100}%; --height: ${e(r)[1]/l[1]*100}%; --offset_x: ${e(n).start[0]/l[0]*100}%; --offset_y: ${e(n).start[1]/l[1]*100}%; --rotate: ${e(n).rotation?`${e(n).rotation}deg`:`0deg`}`),O(c,t),O(f,`Control ${e(n).area.name??``} ${e(n).type??``}`)},[()=>e(n).type.replaceAll(`_`,` `)]),u(t,i)}),E(p(g,2),17,a,k,(t,i)=>{var a=n(),c=f(a),d=t=>{var n=I();E(n,21,()=>e(i).info,k,(t,n)=>{var i=F(),a=o(i),c=t=>{var i=r();s(()=>O(i,`🌡️ ${e(n).value??``}°C`)),u(t,i)},l=t=>{var i=r();s(()=>O(i,`💧 ${e(n).value??``}%`)),u(t,i)};v(a,t=>{e(n).type===`temperature`?t(c):e(n).type===`humidity`&&t(l,1)}),x(i),u(t,i)}),x(n),s(()=>y(n,`--offset_x: ${e(i).start[0]/l[0]*100}%; --offset_y: ${e(i).start[1]/l[1]*100}%; --width: ${e(i).size[0]/l[0]*100}%; --height: ${e(i).size[1]/l[1]*100}%`)),u(t,n)};v(c,t=>{e(i).info?.length&&t(d)}),u(t,a)}),x(d),s(e=>{y(d,`--width: ${l[0]??``}; --height: ${l[1]??``}`),T(h,`viewBox`,`0 0 ${e??``}`)},[()=>l.join(` `)]),u(t,d),S()}var z=D(`<p>Loading...</p>`),B=D(`<h1>House</h1> <!>`,1);function V(n,r){w(r,!0);let o=()=>l(A,`$isAuthenticated`,s),[s,d]=g(),m=h(a([])),_=h(a([])),y=h(!0);c(()=>{o()&&j({gqlQuery:`
					query {
						areas {
							name
							id
							start
							size
							link
							colour
							info {
								value
								type
							}
						}
						items {
							type
							state {
								type
								state
							}
							start
							size
							rotation
							link
							area {
								name
								id
								colour
							}
						}
					}
				`}).then(e=>{C(m,e.areas??[],!0),C(_,e.items??[],!0),C(y,!1)})});var x=B();b(`ebrjdd`,e=>{i(()=>{t.title=`House | Kapers Crewe Household`})});var T=p(f(x),2),E=e=>{u(e,z())},D=t=>{R(t,{get areas(){return e(m)},get items(){return e(_)}})};v(T,t=>{e(y)?t(E):t(D,-1)}),u(n,x),S(),d()}export{V as component};