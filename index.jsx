<ul>
	<repeat expression="item in Model.Item">
		<if expression="$index % 2">
			<li></li>
		</if>
		<switch expression="item.checked">
			<case expression="true">
			</case>
			<case expression="false">
			</case>
		</switch>
	</repeat>
</ul>