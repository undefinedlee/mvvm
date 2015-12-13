<ul>
	<for exp="item in Items">
		<if exp="$index % 2">
			<li></li>
		</if>
		<elseif></elseif>
		<else></else>
		<switch exp="item.checked">
			<case exp="true">
			</case>
			<case exp="false">
			</case>
			<default></default>
		</switch>
	</for>
</ul>

<ul>
	<li vm-for="item in Items">
		<span vm-if="true"></span>
	</li>
</ul>