export function GuideSection() {
  const steps = [
    {
      num: '01',
      title: '10컷 촬영 후 4컷 직접 선택',
      desc: '컬러 또는 흑백 필터로 10번을 자유롭게 촬영하고, 가장 잘 나온 베스트 4컷을 원하는 순서대로 직접 골라 스트립에 채울 수 있습니다.',
    },
    {
      num: '02',
      title: 'AI 자동 보정 (1·2·3단계) 및 프레임',
      desc: 'AI 자동 보정 켜기/끄기와 1·2·3단계 강도를 선택하고, 모노·파스텔·체커보드·Y2K 크롬·35mm 필름 등 17종의 프레임을 조합하세요.',
    },
    {
      num: '03',
      title: '고화질 저장 및 즉시 인화',
      desc: '완성된 네컷사진은 고해상도 PNG 이미지로 바로 저장되며, 인화 버튼을 누르면 용지 여백에 맞춘 깔끔한 출력 화면으로 즉시 인쇄됩니다.',
    },
  ];

  return (
    <>
      <section id="guide" className="no-print border-b border-white/10 py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-10">
            <p className="text-xs font-medium tracking-wider text-zinc-400">
              05. 이용 가이드
            </p>
            <h2 className="font-display mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-white">
              세 단계로 완성하는 네컷사진
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex flex-col border-t border-white/15 pt-5"
              >
                <span className="font-mono-tabular text-xs font-medium text-zinc-400">
                  {step.num}
                </span>
                <h3 className="font-display mt-2 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="no-print py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="font-display text-sm font-bold text-white">
              aesophoto
            </span>
            <span aria-hidden="true">·</span>
            <span>Modern Four-Cut Photo Studio</span>
          </div>
          <p className="text-xs text-zinc-500">
            모든 촬영 및 보정은 브라우저 내에서 안전하게 처리됩니다.
          </p>
        </div>
      </footer>
    </>
  );
}
