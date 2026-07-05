-- 작가 스타일 데이터 v2 강화: authors_db_v2.xlsx(50인, 문체 핵심 키워드/감성 톤/주요 시점/
-- 기존 문학적 특징/대표 문장/주요 대상 장르 포함)로 author_styles를 보강한다. 기존 id/tier/
-- traits(STEP C에서 만든 tier2 재현 신뢰도 시스템)는 그대로 유지하고 컬럼만 추가한다.

alter table public.author_styles
  add column style_keywords text,
  add column emotional_tone text,
  add column main_pov text,
  add column literary_traits text,
  add column representative_sentence text,
  add column target_genre text;

update public.author_styles set
  style_keywords = 'SF, 디스토피아, 연대, 과학적 상상력, 소외',
  emotional_tone = '다정함, 서정적, 미래지향적, 처연함',
  main_pov = '1인칭 주인공 / 3인칭 제한적 시점',
  literary_traits = '[1993~] 한국 SF의 새로운 지평. 과학적 상상력과 소외된 자들을 향한 따뜻한 시선.',
  representative_sentence = '《우리가 빛의 속도로 갈 수 없다면》
“우리가 빛의 속도로 갈 수 없다면, 우리는 어디로 가야 하는 걸까.”',
  target_genre = 'SF 소설, 환상 문학, 과학 에세이'
where name = '김초엽';

update public.author_styles set
  style_keywords = 'SF, 디스토피아, 연대, 과학적 상상력, 소외',
  emotional_tone = '다정함, 서정적, 미래지향적, 처연함',
  main_pov = '1인칭 주인공 / 3인칭 제한적 시점',
  literary_traits = '[1993~] 디스토피아적 세계관 속에서 피어나는 다정한 연대와 종(種)을 초월한 교감.',
  representative_sentence = '《천 개의 파랑》
“천 개의 파랑이 존재한다면, 그중 하나는 너의 이름을 닮았을 것이다.”',
  target_genre = 'SF 소설, 환상 문학, 과학 에세이'
where name = '천선란';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1992~] 2026 부커 인터내셔널 수상자. 역사적 고증 위에 퀴어 서사와 백합 문학을 얹어낸 독창적 미학.',
  representative_sentence = '《대만만유록》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '양솽쯔';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1980~] 청년 세대의 빈곤과 일상의 비극을 눈물 속에서도 반짝이는 경쾌한 재치로 포착.',
  representative_sentence = '《두근두근 내 인생》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '김애란';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1966~] 스릴러적 구성을 동반한 압도적인 서사적 추진력. 인간 내면의 거대한 악과 본능 추적.',
  representative_sentence = '《7년의 밤》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '정유정';

update public.author_styles set
  style_keywords = '시적 압축, 역사적 트라우마, 영혼, 생의 상흔',
  emotional_tone = '아프도록 서정적, 처연함, 나지막함',
  main_pov = '다양한 시점 변주 (1인칭, 2인칭 교차)',
  literary_traits = '[1970~] 2024 노벨문학상 수상자. 역사적 트라우마를 정면으로 마주하는 시적이고 강렬한 문장 미학.',
  representative_sentence = '《채식주의자, 소년이 온다》
“당신이 죽은 뒤 장례식을 치르지 못해, 내 삶이 장례식이 되었습니다.”',
  target_genre = '순수 문학, 서정 시나리오, 메모리얼 에세이'
where name = '한강';

update public.author_styles set
  style_keywords = '도시적 감각, 쿨한 고독, 일상적 기호, 포스트모던',
  emotional_tone = '세련된 허무, 미니멀리즘, 경쾌함',
  main_pov = '1인칭 주인공 시점 (''나'')',
  literary_traits = '[1968~] 냉소적이면서도 세련되고 경쾌한 문체. 도시적 감각과 도발적인 서사 구조가 특징.',
  representative_sentence = '《살인자의 기억법》
“내가 나를 파괴할 권리가 있다고 믿는 순간, 세상은 조금 다르게 보이기 시작한다.”',
  target_genre = '도시 감성 소설, 트렌디 에세이, 현대 소설'
where name = '김영하';

update public.author_styles set
  style_keywords = '서정성, 은유, 내면 성찰, 여백의 미',
  emotional_tone = '처연함, 서정적, 은은함',
  main_pov = '1인칭 시점',
  literary_traits = '[1963~] 상실의 고통과 인간 내면의 고독을 서정적이고 흐느끼는 듯한 섬세한 문체로 서술.',
  representative_sentence = '《외딴방, 엄마를 부탁해》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '시, 감성 수필, 서정 소설'
where name = '신경숙';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1959~] 냉정하면서도 유머러스한 문체. 인간관계의 가식과 삶의 비극을 세련되게 비틂.',
  representative_sentence = '《새의 선물》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '은희경';

update public.author_styles set
  style_keywords = '리얼리즘, 반어법, 하층민의 삶, 사회 고발',
  emotional_tone = '비극적 비장함, 냉정함, 객관적',
  main_pov = '3인칭 전지적/제한적 시점',
  literary_traits = '[1953~] 2025 부커 인터내셔널 수상자. 인도 여성의 인권과 가부장제 모순을 폭로하는 선 굵은 리얼리즘.',
  representative_sentence = '《하트 램프》
“설렁탕을 사다 놓았는데 왜 먹지를 못하니, 왜 먹지를 못하니... 괴상하게도 오늘은 운수가 좋더니만...”',
  target_genre = '사실주의 소설, 사회 평론'
where name = '바누 무쉬타크';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1954~] 노벨문학상 수상자. 억압된 기억과 자기기만을 다루는 극도로 절제되고 우아한 문체.',
  representative_sentence = '《남아있는 나날》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '카즈오 이시구로';

update public.author_styles set
  style_keywords = '서정성, 은유, 내면 성찰, 여백의 미',
  emotional_tone = '처연함, 서정적, 은은함',
  main_pov = '1인칭 시점',
  literary_traits = '[1954~] 2025 노벨문학상 수상자. 쉼표로 끝없이 이어지는 수백 페이지짜리 장문과 묵시록적 세계관.',
  representative_sentence = '《저항의 멜랑콜리》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '시, 감성 수필, 서정 소설'
where name = '라스로 크라스나호르카이';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1952~] 이슬람과 서구 문명의 충돌을 다루는 복잡하고 정교한 포스트모더니즘적 구성.',
  representative_sentence = '《내 이름은 빨강》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '오르한 파묵';

update public.author_styles set
  style_keywords = '도시적 감각, 쿨한 고독, 일상적 기호, 포스트모던',
  emotional_tone = '세련된 허무, 미니멀리즘, 경쾌함',
  main_pov = '1인칭 주인공 시점 (''나'')',
  literary_traits = '[1949~] 서구 번역투의 경쾌함과 감각적인 기호 배치를 통해 현대인의 도시적 상실감을 묘사.',
  representative_sentence = '《상실의 시대, 1Q84》
“하지만 무엇이 최선인지 그 누가 말할 수 있겠어? 그러니까 누군가로부터 행복을 얻을 기회가 있다면 주저 말고 잡아야 해.”',
  target_genre = '도시 감성 소설, 트렌디 에세이, 현대 소설'
where name = '무라카미 하루키';

update public.author_styles set
  style_keywords = '하드보일드, 빙산 이론, 절제미, 행동주의, 조사 배제',
  emotional_tone = '건조함, 냉혹함, 비장함, 선이 굵은 허무',
  main_pov = '3인칭 제한적 시점 / 1인칭',
  literary_traits = '[1948~] 극단적인 주어+동사 중심의 하드보일드 문체. 감정을 배제한 칼날 같은 문장.',
  representative_sentence = '《칼의 노래, 남한산성》
“버려진 섬마다 꽃이 피었다. 꽃이 피는 순서대로 섬은 육지로부터 멀어졌다.”',
  target_genre = '하드보일드 소설, 역사 소설, 비즈니스 칼럼'
where name = '김훈';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1956~] 서구 자본주의와 자유주의의 몰락을 극단적인 냉소와 도발적인 어조로 해부하는 문체.',
  representative_sentence = '《소소한 입자, 복종》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '미셸 우엘베크';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1940~] 노벨문학상 수상자. 사적인 기억과 사회학을 결합한, 감상성을 철저히 배제한 ''칼 같은 글쓰기''.',
  representative_sentence = '《세월, 빈 객석》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '아니 에르노';

update public.author_styles set
  style_keywords = '리얼리즘, 민중 서사, 역사적 고증, 생명 사상',
  emotional_tone = '웅장함, 역동적, 비장함, 끈질긴 생명력',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1943~] 한국 리얼리즘의 대가. 민중의 역동적인 삶을 힘 있고 거침없는 필치로 복원.',
  representative_sentence = '《삼포 가는 길, 장길산》
“길이란 걷는 자의 것이고, 살아남은 자의 발자취가 곧 역사다.”',
  target_genre = '대하 소설, 역사 소설, 리얼리즘 문학'
where name = '황석영';

update public.author_styles set
  style_keywords = '리얼리즘, 민중 서사, 역사적 고증, 생명 사상',
  emotional_tone = '웅장함, 역동적, 비장함, 끈질긴 생명력',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1943~] 철저한 고증과 민중 중심의 역사 인식. 민족 분단의 아픔을 선 굵은 대하 서사로 추적.',
  representative_sentence = '《태백산맥, 아리랑》
“역사는 민중의 핏방울이 모여 흐르는 거대한 강물이다.”',
  target_genre = '대하 소설, 역사 소설, 리얼리즘 문학'
where name = '조정래';

update public.author_styles set
  style_keywords = '서정성, 은유, 내면 성찰, 여백의 미',
  emotional_tone = '처연함, 서정적, 은은함',
  main_pov = '1인칭 시점',
  literary_traits = '[1936~] 라틴 아메리카의 정치적 현실을 복잡한 시점 전환과 구조적 실험을 통해 고발.',
  representative_sentence = '《염소의 축제, 녹색 집》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '시, 감성 수필, 서정 소설'
where name = '마리오 바르가스 요사';

update public.author_styles set
  style_keywords = '서정성, 은유, 내면 성찰, 여백의 미',
  emotional_tone = '처연함, 서정적, 은은함',
  main_pov = '1인칭 시점',
  literary_traits = '[1947~1998] 모국어의 숨결을 극한까지 살려낸 유려한 문체. 전통 세시풍속과 언어의 아름다움 복원.',
  representative_sentence = '《혼불》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '시, 감성 수필, 서정 소설'
where name = '최명희';

update public.author_styles set
  style_keywords = '지성, 관념 소설, 이데올로기, 실존적 고뇌, 철학적 사유',
  emotional_tone = '지적 냉소, 사유 중심, 사색적',
  main_pov = '3인칭 전지적 / 에세이적 개입',
  literary_traits = '[1948~] 화려하고 유려한 만화경식 문체. 보수적 가치관과 관념적이고 지적인 사유의 전형.',
  representative_sentence = '《사람의 아들》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '관념 소설, 지식인 소설, 철학 칼럼, 서평'
where name = '이문열';

update public.author_styles set
  style_keywords = '지성, 관념 소설, 이데올로기, 실존적 고뇌, 철학적 사유',
  emotional_tone = '지적 냉소, 사유 중심, 사색적',
  main_pov = '3인칭 전지적 / 에세이적 개입',
  literary_traits = '[1939~2008] 지적이고 치밀한 구성. 권력과 인간, 예술의 구원 가능성을 집요하게 탐구.',
  representative_sentence = '《당신들의 천국, 서편제》
“지배하는 자의 천국은 언제나 당하는 자의 지옥이기 마련입니다.”',
  target_genre = '관념 소설, 지식인 소설, 철학 칼럼, 서평'
where name = '이청준';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1947~] 밀도 높은 상징과 내밀하고 침잠하는 여성의 내면 묘사. 일상의 균열을 포착하는 미학.',
  representative_sentence = '《유년의 뜰》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '오정희';

update public.author_styles set
  style_keywords = '서정성, 은유, 내면 성찰, 여백의 미',
  emotional_tone = '처연함, 서정적, 은은함',
  main_pov = '1인칭 시점',
  literary_traits = '[1955~] 소외된 이웃을 바라보는 예리하고도 따뜻한 시선. 문학성과 대중성의 조화.',
  representative_sentence = '《원미동 사람들, 모순》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '시, 감성 수필, 서정 소설'
where name = '양귀자';

update public.author_styles set
  style_keywords = '지성, 관념 소설, 이데올로기, 실존적 고뇌, 철학적 사유',
  emotional_tone = '지적 냉소, 사유 중심, 사색적',
  main_pov = '3인칭 전지적 / 에세이적 개입',
  literary_traits = '[1936~2018] 사유적이고 관념적인 문체. 분단 현실 속 인간의 실존적 고뇌를 철학적으로 비판.',
  representative_sentence = '《광장》
“광장은 비어 있고, 밀실은 닫혀 있다. 인간은 광장과 밀실을 동시에 필요로 한다.”',
  target_genre = '관념 소설, 지식인 소설, 철학 칼럼, 서평'
where name = '최인훈';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1942~] 분단 문학의 개척자. 전쟁과 분단이 개인의 내면에 남긴 상흔을 사실적으로 서술.',
  representative_sentence = '《마당 깊은 집》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '김원일';

update public.author_styles set
  style_keywords = '서정성, 은유, 내면 성찰, 여백의 미',
  emotional_tone = '처연함, 서정적, 은은함',
  main_pov = '1인칭 시점',
  literary_traits = '[1942~2022] 산업화 과정에서 소외된 이들의 비극을 시적이고 우화적인 문체와 압축적 구성으로 묘사.',
  representative_sentence = '《난장이가 쏘아올린 작은 공》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '시, 감성 수필, 서정 소설'
where name = '조세희';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1931~2011] 중산층의 허위의식과 전쟁의 상흔 해부. 일상적 언어로 속물성을 예리하게 포착.',
  representative_sentence = '《나목》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '박완서';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1931~2019] 흑인 여성의 고통을 영적이고 신화적인 언어, 음악적 리듬을 가진 문체로 승화.',
  representative_sentence = '《빌러비드, 가장 푸른 눈》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '토니 모리슨';

update public.author_styles set
  style_keywords = '지성, 관념 소설, 이데올로기, 실존적 고뇌, 철학적 사유',
  emotional_tone = '지적 냉소, 사유 중심, 사색적',
  main_pov = '3인칭 전지적 / 에세이적 개입',
  literary_traits = '[1929~2023] 소설과 철학적 에세이의 경계를 허무는 문체. 역사적 무거움과 개인의 가벼움 사이의 아이러니.',
  representative_sentence = '《참을 수 없는 존재의 가벼움》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '관념 소설, 지식인 소설, 철학 칼럼, 서평'
where name = '밀란 쿤데라';

update public.author_styles set
  style_keywords = '마술적 리얼리즘, 신화적 서사, 순환적 시간',
  emotional_tone = '황홀함, 원시적 생동감, 경외감',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1927~2014] 마술적 리얼리즘의 거장. 초자연적 사건을 태연하게 서술하며 환상과 현실을 융합.',
  representative_sentence = '《백년 동안의 고독》
“여러 해가 지난 후, 총살 집행 대원들 앞에 서게 되었을 때, 아우렐리아노 부엔디아 대령은 아버지가 얼음을 구경시켜 주러 데리고 갔던 그 먼 옛날 오후를 기억해 낼 것이다.”',
  target_genre = '대하 소설, 판타지 서사, 신화적 연대기'
where name = '가브리엘 가르시아 마르케스';

update public.author_styles set
  style_keywords = '리얼리즘, 민중 서사, 역사적 고증, 생명 사상',
  emotional_tone = '웅장함, 역동적, 비장함, 끈질긴 생명력',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1926~2008] 생명 사상을 바탕으로 한 거대한 서사적 집요함. 인간 존엄성을 끈질기게 추적.',
  representative_sentence = '《토지》
“그 고단한 세월을 견디며 인간은 비로소 스스로가 생명임을 증명한다.”',
  target_genre = '대하 소설, 역사 소설, 리얼리즘 문학'
where name = '박경리';

update public.author_styles set
  style_keywords = '서정성, 은유, 내면 성찰, 여백의 미',
  emotional_tone = '처연함, 서정적, 은은함',
  main_pov = '1인칭 시점',
  literary_traits = '[1941~] 1960년대 감수성의 혁명. 감각적이고 세련된 문체로 도시화 속 소외된 개인 포착.',
  representative_sentence = '《무진기행》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '시, 감성 수필, 서정 소설'
where name = '김승옥';

update public.author_styles set
  style_keywords = '서정성, 은유, 내면 성찰, 여백의 미',
  emotional_tone = '처연함, 서정적, 은은함',
  main_pov = '1인칭 시점',
  literary_traits = '[1923~1985] 환상적이고 기호학적인 실험. 문학적 상상력의 한계를 시험하는 정교한 플롯.',
  representative_sentence = '《보이지 않는 도시들》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '시, 감성 수필, 서정 소설'
where name = '이탈로 칼비노';

update public.author_styles set
  style_keywords = '저널리즘적 명료함, 정치적 목적의식, 풍자, 전체주의 비판',
  emotional_tone = '명징함, 고발성, 객관적 분노',
  main_pov = '3인칭 전지적/제한적 시점',
  literary_traits = '[1903~1950] 명확하고 간결한 저널리즘적 문체. 전체주의와 권력의 부패를 날카롭게 고발하는 우화.',
  representative_sentence = '《1984, 동물농장》
“빅 브라더가 당신을 지켜보고 있다. (Big Brother is Watching You.)”',
  target_genre = '디스토피아 소설, 사회 고발 칼럼, 풍자 문학'
where name = '조지 오웰';

update public.author_styles set
  style_keywords = '부조리, 실존주의, 이방인적 시선, 반항',
  emotional_tone = '건조함, 명징함, 반항적 의지',
  main_pov = '1인칭 주인공 시점',
  literary_traits = '[1913~1960] 실존주의와 부조리 문학. 극도로 건조하고 명징한 문체로 인간 존재의 근본적 부조리 대면.',
  representative_sentence = '《이방인, 페스트》
“오늘 엄마가 죽었다. 아니 어쩌면 어제였는지도 모른다. 난 잘 모르겠다.”',
  target_genre = '실존주의 소설, 철학 수필, 희곡'
where name = '알베르 카뮈';

update public.author_styles set
  style_keywords = '지성, 관념 소설, 이데올로기, 실존적 고뇌, 철학적 사유',
  emotional_tone = '지적 냉소, 사유 중심, 사색적',
  main_pov = '3인칭 전지적 / 에세이적 개입',
  literary_traits = '[1899~1986] 미로, 도서관, 거울 등의 상징을 활용한 극단적으로 지적이고 압축적인 환상 문학.',
  representative_sentence = '《픽션들, 알레프》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '관념 소설, 지식인 소설, 철학 칼럼, 서평'
where name = '호르헤 루이스 보르헤스';

update public.author_styles set
  style_keywords = '하드보일드, 빙산 이론, 절제미, 행동주의, 조사 배제',
  emotional_tone = '건조함, 냉혹함, 비장함, 선이 굵은 허무',
  main_pov = '3인칭 제한적 시점 / 1인칭',
  literary_traits = '[1899~1961] 하드보일드 문체의 전형. 수식어를 배제한 채 차가운 표면 아래 정서적 압력을 숨기는 빙산 이론.',
  representative_sentence = '《노인과 바다》
“The world breaks every one and afterward many are strong at the broken places.”',
  target_genre = '하드보일드 소설, 역사 소설, 비즈니스 칼럼'
where name = '어네스트 헤밍웨이';

update public.author_styles set
  style_keywords = '서정성, 은유, 내면 성찰, 여백의 미',
  emotional_tone = '처연함, 서정적, 은은함',
  main_pov = '1인칭 시점',
  literary_traits = '[1915~2000] 정제된 단편 소설의 미학. 인간의 순수성에 대한 신뢰와 서정적이고 간결한 문체.',
  representative_sentence = '《소나기, 카인의 후예》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '시, 감성 수필, 서정 소설'
where name = '황순원';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1910~1937] 초현실주의와 모더니즘의 극단. 의식의 흐름 기법과 형식 파괴를 통한 자아 분열 묘사.',
  representative_sentence = '《날개, 오감도》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '이상';

update public.author_styles set
  style_keywords = '카프카에스크, 관료제적 건조함, 부조리, 인간 소외',
  emotional_tone = '악몽 같은 부조리, 무기력, 이성적 냉소',
  main_pov = '3인칭 제한적 시점',
  literary_traits = '[1883~1924] 건조하고 논리적인 행정 문서 스타일로 미쳐버린 초현실적 세계와 인간 소외를 섬세하게 폭로.',
  representative_sentence = '《변신, 소송》
“어느 날 아침 그레고르 잠자가 불안한 꿈에서 깨어났을 때, 그는 침대 속에서 자신이 한 마리의 거대한 갑충으로 변해 있다는 것을 발견했다.”',
  target_genre = '초현실주의 문학, 디스토피아 SF, 블랙 코미디'
where name = '프란츠 카프카';

update public.author_styles set
  style_keywords = '의식의 흐름, 시적 산문, 내밀한 독백, 여성주의',
  emotional_tone = '몽환적, 감각적, 예민함, 내밀함',
  main_pov = '1인칭 / 다중 제한적 시점',
  literary_traits = '[1882~1941] 의식의 흐름 기법의 선구자. 시적 산문과 심리적 시간의 흐름을 따르는 음악적 리듬.',
  representative_sentence = '《등대로, 세월》
“생각이란 인간의 활동 중 가장 취약하며, 가장 파괴되기 쉬운 것이다.”',
  target_genre = '심리 소설, 감성 에세이, 예술 비평'
where name = '버지니아 울프';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1882~1941] 언어의 한계를 실험하는 방대하고 난해한 패러디와 백과사전적 지식, 의식의 흐름 기법의 극치.',
  representative_sentence = '《율리시스》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '제임스 조이스';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1871~1922] 인간의 기억과 무의식을 포착하기 위해 쉼표와 수식어로 길게 이어지는 극도로 정밀하고 탐미적인 문체.',
  representative_sentence = '《잃어버린 시간을 찾아서》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '마르셀 프루스트';

update public.author_styles set
  style_keywords = '풍자, 해학, 냉소, 사설조, 반어법',
  emotional_tone = '골계미, 유머러스, 냉소적 풍자',
  main_pov = '3인칭 전지적 시점 / 판소리 화자',
  literary_traits = '[1902~1950] 날카로운 풍자와 냉소, 판소리풍의 사설조 문체로 식민지 사회 모순과 지식인의 타락 고발.',
  representative_sentence = '《태평천하, 탁류》
“돈이 있으면 태평천하요, 돈이 없으면 지옥이라 하더냐.”',
  target_genre = '풍자 소설, 블랙 코미디, 칼럼'
where name = '채만식';

update public.author_styles set
  style_keywords = '서정성, 은유, 내면 성찰, 여백의 미',
  emotional_tone = '처연함, 서정적, 은은함',
  main_pov = '1인칭 시점',
  literary_traits = '[1907~1942] 심미주의적이고 시적인 산문. 자연과 인간의 원초적 에로티시즘을 서정적으로 융합.',
  representative_sentence = '《메밀꽃 필 무렵》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '시, 감성 수필, 서정 소설'
where name = '이효석';

update public.author_styles set
  style_keywords = '풍자, 해학, 냉소, 사설조, 반어법',
  emotional_tone = '골계미, 유머러스, 냉소적 풍자',
  main_pov = '3인칭 전지적 시점 / 판소리 화자',
  literary_traits = '[1908~1937] 토속적인 어휘와 해학, 풍자. 절망적인 농촌 현실을 특유의 기지와 웃음으로 승화.',
  representative_sentence = '《봄·봄, 동백꽃》
“돈이 있으면 태평천하요, 돈이 없으면 지옥이라 하더냐.”',
  target_genre = '풍자 소설, 블랙 코미디, 칼럼'
where name = '김유정';

update public.author_styles set
  style_keywords = '리얼리즘, 반어법, 하층민의 삶, 사회 고발',
  emotional_tone = '비극적 비장함, 냉정함, 객관적',
  main_pov = '3인칭 전지적/제한적 시점',
  literary_traits = '[1900~1943] 한국 단편 소설 기틀 확립. 사실주의(리얼리즘)에 기반한 정교한 구조와 반어법적 비극 묘사.',
  representative_sentence = '《운수 좋은 날》
“설렁탕을 사다 놓았는데 왜 먹지를 못하니, 왜 먹지를 못하니... 괴상하게도 오늘은 운수가 좋더니만...”',
  target_genre = '사실주의 소설, 사회 평론'
where name = '현진건';

update public.author_styles set
  style_keywords = '모더니즘, 실존, 인간 본연의 탐구',
  emotional_tone = '차분함, 객관적 서정성',
  main_pov = '3인칭 전지적 시점',
  literary_traits = '[1821~1881] 인간 심리의 가장 어두운 심연과 도덕적 딜레마를 집요하게 파고드는 다성악적 서사 구조.',
  representative_sentence = '《죄와 벌, 카라마조프 가의 형제들》
대표적인 문장 구절이 포함됩니다.',
  target_genre = '현대 소설, 순수 문학'
where name = '표도르 도스토옙스키';

