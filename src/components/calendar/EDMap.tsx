'use client';

import { getZoneStyles } from '@/lib/shiftgen';

interface EDMapProps {
  dailyData: any;
}

export default function EDMap({ dailyData }: EDMapProps) {
  // For now, just create the map structure without zone highlighting
  // User can customize room number placement later

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg
        viewBox="0 0 1000 800"
        className="w-full h-auto max-h-[600px]"
        style={{ maxWidth: '100%' }}
      >
        {/* Define styles */}
        <defs>
          <style>
            {`
              .room-box {
                fill: white;
                stroke: #3f3f46;
                stroke-width: 2;
              }
              .room-text {
                fill: #18181b;
                font-size: 14px;
                font-family: system-ui, -apple-system, sans-serif;
                text-anchor: middle;
                dominant-baseline: middle;
              }
              .zone-label {
                fill: #52525b;
                font-size: 12px;
                font-family: system-ui, -apple-system, sans-serif;
                text-anchor: middle;
                font-weight: 600;
              }
              .scribe-circle {
                fill: #e4e4e7;
                stroke: #71717a;
                stroke-width: 1.5;
              }
            `}
          </style>
        </defs>

        {/* LEFT MARGIN - U-shaped box */}
        <g id="left-margin">
          {/* Outer U-shape path */}
          <path
            d="M 50 50 L 200 50 L 200 200 L 150 200 L 150 600 L 200 600 L 200 750 L 50 750 Z"
            className="room-box"
          />

          {/* Room labels - top row */}
          <text x="75" y="75" className="room-text">23</text>
          <text x="125" y="75" className="room-text">21</text>
          <text x="175" y="75" className="room-text">77</text>

          {/* Room labels - left column */}
          <text x="75" y="150" className="room-text">78</text>
          <text x="75" y="250" className="room-text">MT01</text>
          <text x="75" y="320" className="room-text">MT02</text>
          <text x="75" y="390" className="room-text">MT03</text>
          <text x="75" y="460" className="room-text">MT04</text>
          <text x="75" y="530" className="room-text">IWR</text>
          <text x="75" y="650" className="room-text">48</text>
          <text x="75" y="720" className="room-text">46</text>
        </g>

        {/* INNER LEFT UPPER BOX */}
        <g id="inner-left-upper">
          <rect x="220" y="50" width="140" height="180" className="room-box" />

          {/* Divide into 5 sections */}
          <line x1="220" y1="86" x2="360" y2="86" stroke="#3f3f46" strokeWidth="1" />
          <line x1="220" y1="122" x2="360" y2="122" stroke="#3f3f46" strokeWidth="1" />
          <line x1="220" y1="158" x2="360" y2="158" stroke="#3f3f46" strokeWidth="1" />
          <line x1="220" y1="194" x2="360" y2="194" stroke="#3f3f46" strokeWidth="1" />

          <text x="290" y="68" className="room-text">79</text>
          <text x="290" y="104" className="room-text">15</text>
          <text x="290" y="140" className="room-text">11</text>
          <text x="290" y="176" className="room-text">9</text>
          <text x="290" y="212" className="room-text">7</text>
        </g>

        {/* INNER LEFT LOWER BOX */}
        <g id="inner-left-lower">
          <rect x="220" y="250" width="140" height="180" className="room-box" />

          {/* Divide into 5 sections */}
          <line x1="220" y1="286" x2="360" y2="286" stroke="#3f3f46" strokeWidth="1" />
          <line x1="220" y1="322" x2="360" y2="322" stroke="#3f3f46" strokeWidth="1" />
          <line x1="220" y1="358" x2="360" y2="358" stroke="#3f3f46" strokeWidth="1" />
          <line x1="220" y1="394" x2="360" y2="394" stroke="#3f3f46" strokeWidth="1" />

          <text x="290" y="268" className="room-text">8</text>
          <text x="290" y="304" className="room-text">10</text>
          <text x="290" y="340" className="room-text">12</text>
          <text x="290" y="376" className="room-text">14</text>
          <text x="290" y="412" className="room-text">44</text>
        </g>

        {/* TOP MIDDLE BOX */}
        <g id="top-middle">
          <rect x="380" y="50" width="240" height="90" className="room-box" />

          {/* Divide into 4 sections */}
          <line x1="440" y1="50" x2="440" y2="140" stroke="#3f3f46" strokeWidth="1" />
          <line x1="500" y1="50" x2="500" y2="140" stroke="#3f3f46" strokeWidth="1" />
          <line x1="560" y1="50" x2="560" y2="140" stroke="#3f3f46" strokeWidth="1" />

          <text x="410" y="95" className="room-text">27</text>
          <text x="470" y="95" className="room-text">25</text>
          <text x="530" y="95" className="room-text">41</text>
          <text x="590" y="95" className="room-text">39</text>
        </g>

        {/* UPPER MIDDLE BOX */}
        <g id="upper-middle">
          <rect x="380" y="160" width="240" height="120" className="room-box" />

          {/* Divide into 6 sections (2x3 grid) */}
          <line x1="460" y1="160" x2="460" y2="280" stroke="#3f3f46" strokeWidth="1" />
          <line x1="540" y1="160" x2="540" y2="280" stroke="#3f3f46" strokeWidth="1" />
          <line x1="380" y1="220" x2="620" y2="220" stroke="#3f3f46" strokeWidth="1" />

          <text x="420" y="190" className="room-text">19</text>
          <text x="500" y="190" className="room-text">31</text>
          <text x="580" y="190" className="room-text">17</text>
          <text x="420" y="250" className="room-text">29</text>
          <text x="500" y="250" className="room-text">5</text>
          <text x="580" y="250" className="room-text">3</text>
        </g>

        {/* MAIN ZONE - Center box with scribe circles */}
        <g id="main-zone">
          <rect x="380" y="300" width="240" height="120" className="room-box" />

          <text x="500" y="330" className="zone-label">Main Zone</text>

          {/* Three scribe circles */}
          <circle cx="420" cy="370" r="20" className="scribe-circle" />
          <circle cx="500" cy="370" r="20" className="scribe-circle" />
          <circle cx="580" cy="370" r="20" className="scribe-circle" />
        </g>

        {/* LOWER MIDDLE BOX */}
        <g id="lower-middle">
          <rect x="380" y="440" width="240" height="120" className="room-box" />

          {/* Divide into 6 sections (2x3 grid) */}
          <line x1="460" y1="440" x2="460" y2="560" stroke="#3f3f46" strokeWidth="1" />
          <line x1="540" y1="440" x2="540" y2="560" stroke="#3f3f46" strokeWidth="1" />
          <line x1="380" y1="500" x2="620" y2="500" stroke="#3f3f46" strokeWidth="1" />

          <text x="420" y="470" className="room-text">6</text>
          <text x="500" y="470" className="room-text">4</text>
          <text x="580" y="470" className="room-text">16</text>
          <text x="420" y="530" className="room-text">28</text>
          <text x="500" y="530" className="room-text">18</text>
          <text x="580" y="530" className="room-text">30</text>
        </g>

        {/* BOTTOM MIDDLE BOX */}
        <g id="bottom-middle">
          <rect x="380" y="580" width="240" height="90" className="room-box" />

          {/* Divide into 4 sections */}
          <line x1="440" y1="580" x2="440" y2="670" stroke="#3f3f46" strokeWidth="1" />
          <line x1="500" y1="580" x2="500" y2="670" stroke="#3f3f46" strokeWidth="1" />
          <line x1="560" y1="580" x2="560" y2="670" stroke="#3f3f46" strokeWidth="1" />

          <text x="410" y="625" className="room-text">24</text>
          <text x="470" y="625" className="room-text">36</text>
          <text x="530" y="625" className="room-text">26</text>
          <text x="590" y="625" className="room-text">38</text>
        </g>

        {/* RIGHT TOP RECTANGLE */}
        <g id="right-top">
          <rect x="640" y="50" width="160" height="240" className="room-box" />

          {/* Divide into 6 sections */}
          <line x1="640" y1="90" x2="800" y2="90" stroke="#3f3f46" strokeWidth="1" />
          <line x1="640" y1="130" x2="800" y2="130" stroke="#3f3f46" strokeWidth="1" />
          <line x1="640" y1="170" x2="800" y2="170" stroke="#3f3f46" strokeWidth="1" />
          <line x1="640" y1="210" x2="800" y2="210" stroke="#3f3f46" strokeWidth="1" />
          <line x1="640" y1="250" x2="800" y2="250" stroke="#3f3f46" strokeWidth="1" />

          <text x="720" y="70" className="room-text">45</text>
          <text x="720" y="110" className="room-text">43</text>
          <text x="720" y="150" className="room-text">37</text>
          <text x="720" y="190" className="room-text">35</text>
          <text x="720" y="230" className="room-text">1B</text>
          <text x="720" y="270" className="room-text">1A</text>
        </g>

        {/* RIGHT BOTTOM RECTANGLE */}
        <g id="right-bottom">
          <rect x="640" y="310" width="160" height="240" className="room-box" />

          {/* Divide into 6 sections */}
          <line x1="640" y1="350" x2="800" y2="350" stroke="#3f3f46" strokeWidth="1" />
          <line x1="640" y1="390" x2="800" y2="390" stroke="#3f3f46" strokeWidth="1" />
          <line x1="640" y1="430" x2="800" y2="430" stroke="#3f3f46" strokeWidth="1" />
          <line x1="640" y1="470" x2="800" y2="470" stroke="#3f3f46" strokeWidth="1" />
          <line x1="640" y1="510" x2="800" y2="510" stroke="#3f3f46" strokeWidth="1" />

          <text x="720" y="330" className="room-text">2A</text>
          <text x="720" y="370" className="room-text">2B</text>
          <text x="720" y="410" className="room-text">32</text>
          <text x="720" y="450" className="room-text">34</text>
          <text x="720" y="490" className="room-text">40</text>
          <text x="720" y="530" className="room-text">42</text>
        </g>
      </svg>

      <div className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
        ED Map Layout - Room numbers shown
      </div>
    </div>
  );
}
