import type { Problem } from "../problems";

export const STRINGS_SEARCH_PROBLEMS: Problem[] = [
  {
    id: "binary-search",
    slug: "binary-search",
    title: "19. Binary Search",
    difficulty: "Easy",
    topic: "Binary Search",
    acceptance: "57.3%",
    companies: ["Google", "Meta", "Uber", "Microsoft"],
    diagramType: "array_pointers",
    description: `Given a sorted integer array \`nums\` and a \`target\`, return its index if found, otherwise return \`-1\` in \`O(log n)\` time.`,
    examples: [{ input: "nums = [-1, 0, 3, 5, 9, 12], target = 9", output: "4" }],
    constraints: ["1 <= nums.length <= 10^4"],
    defaultStdin: "-1 0 3 5 9 12\n9",
    templates: {
      python: `def binarySearch(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

nums = [-1, 0, 3, 5, 9, 12]
print("Found index:", binarySearch(nums, 9))
`,
      javascript: `function binarySearch(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
const nums = [-1, 0, 3, 5, 9, 12];
console.log("Found index:", binarySearch(nums, 9));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {-1, 0, 3, 5, 9, 12}; int t = 9, l = 0, r = a.size()-1, ans = -1;
    while (l <= r) { int m = l+(r-l)/2; if (a[m]==t){ans=m;break;} if(a[m]<t)l=m+1; else r=m-1; }
    cout << ans << endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] a = {-1, 0, 3, 5, 9, 12}; int t = 9, l = 0, r = a.length-1, ans = -1;
        while (l <= r) { int m = l+(r-l)/2; if (a[m]==t){ans=m;break;} if(a[m]<t)l=m+1; else r=m-1; }
        System.out.println(ans);
    }
}
`,
    },
  },
  {
    id: "search-insert-position",
    slug: "search-insert-position",
    title: "20. Search Insert Position",
    difficulty: "Easy",
    topic: "Binary Search",
    acceptance: "46.1%",
    companies: ["Amazon", "TCS", "Google"],
    diagramType: "array_pointers",
    description: `Return the index if \`target\` is found in a sorted array of distinct integers, or the index where it would be inserted in order.`,
    examples: [{ input: "nums = [1, 3, 5, 6], target = 2", output: "1" }],
    constraints: ["1 <= nums.length <= 10^4"],
    defaultStdin: "1 3 5 6\n2",
    templates: {
      python: `def searchInsert(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return left

nums = [1, 3, 5, 6]
print("Insert index:", searchInsert(nums, 2))
`,
      javascript: `function searchInsert(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return left;
}
const nums = [1, 3, 5, 6];
console.log("Insert index:", searchInsert(nums, 2));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {1,3,5,6}; int t = 2, l = 0, r = a.size()-1;
    while (l <= r) { int m=(l+r)/2; if(a[m]<t) l=m+1; else r=m-1; }
    cout << l << endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] a = {1,3,5,6}; int t = 2, l = 0, r = a.length-1;
        while (l <= r) { int m=(l+r)/2; if(a[m]<t) l=m+1; else r=m-1; }
        System.out.println(l);
    }
}
`,
    },
  },
  {
    id: "find-first-last-position",
    slug: "find-first-last-position",
    title: "21. First and Last Position in Sorted Array",
    difficulty: "Medium",
    topic: "Binary Search",
    acceptance: "44.5%",
    companies: ["Meta", "Amazon", "LinkedIn", "Google"],
    diagramType: "array_pointers",
    description: `Given a sorted array \`nums\` and \`target\`, return the starting and ending index of \`target\` in \`O(log n)\`, or \`[-1, -1]\`.`,
    examples: [{ input: "nums = [5, 7, 7, 8, 8, 10], target = 8", output: "[3, 4]" }],
    constraints: ["0 <= nums.length <= 10^5"],
    defaultStdin: "5 7 7 8 8 10\n8",
    templates: {
      python: `def bound(nums, target, first):
    left, right, ans = 0, len(nums) - 1, -1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            ans = mid
            if first: right = mid - 1
            else: left = mid + 1
        elif nums[mid] < target: left = mid + 1
        else: right = mid - 1
    return ans

nums = [5, 7, 7, 8, 8, 10]
print("Range:", [bound(nums, 8, True), bound(nums, 8, False)])
`,
      javascript: `function bound(nums, target, first) {
  let left = 0, right = nums.length - 1, ans = -1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) {
      ans = mid;
      if (first) right = mid - 1; else left = mid + 1;
    } else if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return ans;
}
const nums = [5, 7, 7, 8, 8, 10];
console.log("Range:", [bound(nums, 8, true), bound(nums, 8, false)]);
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> a = {5,7,7,8,8,10};
    auto lo = lower_bound(a.begin(), a.end(), 8) - a.begin();
    auto hi = upper_bound(a.begin(), a.end(), 8) - a.begin() - 1;
    cout << lo << " " << hi << endl;
}
`,
      java: `public class Main {
    static int b(int[] a, int t, boolean f) {
        int l=0,r=a.length-1,ans=-1;
        while(l<=r){int m=(l+r)/2;if(a[m]==t){ans=m;if(f)r=m-1;else l=m+1;}else if(a[m]<t)l=m+1;else r=m-1;}
        return ans;
    }
    public static void main(String[] args){int[]a={5,7,7,8,8,10};System.out.println(b(a,8,true)+" "+b(a,8,false));}
}
`,
    },
  },
  {
    id: "search-rotated-sorted-array",
    slug: "search-rotated-sorted-array",
    title: "22. Search in Rotated Sorted Array",
    difficulty: "Medium",
    topic: "Binary Search",
    acceptance: "41.1%",
    companies: ["Amazon", "Meta", "Microsoft", "Uber"],
    diagramType: "array_pointers",
    description: `Search \`target\` in a sorted array rotated at an unknown pivot index in \`O(log n)\` time.`,
    examples: [{ input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 0", output: "4" }],
    constraints: ["1 <= nums.length <= 5000", "Distinct values"],
    defaultStdin: "4 5 6 7 0 1 2\n0",
    templates: {
      python: `def searchRotated(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[left] <= nums[mid]:
            if nums[left] <= target < nums[mid]: right = mid - 1
            else: left = mid + 1
        else:
            if nums[mid] < target <= nums[right]: left = mid + 1
            else: right = mid - 1
    return -1

nums = [4, 5, 6, 7, 0, 1, 2]
print("Index:", searchRotated(nums, 0))
`,
      javascript: `function searchRotated(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) right = mid - 1;
      else left = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[right]) left = mid + 1;
      else right = mid - 1;
    }
  }
  return -1;
}
const nums = [4, 5, 6, 7, 0, 1, 2];
console.log("Index:", searchRotated(nums, 0));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {4,5,6,7,0,1,2}; int t=0, l=0, r=a.size()-1, ans=-1;
    while(l<=r){int m=(l+r)/2;if(a[m]==t){ans=m;break;}if(a[l]<=a[m]){if(a[l]<=t&&t<a[m])r=m-1;else l=m+1;}else{if(a[m]<t&&t<=a[r])l=m+1;else r=m-1;}}
    cout << ans << endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] a={4,5,6,7,0,1,2};int t=0,l=0,r=a.length-1,ans=-1;
        while(l<=r){int m=(l+r)/2;if(a[m]==t){ans=m;break;}if(a[l]<=a[m]){if(a[l]<=t&&t<a[m])r=m-1;else l=m+1;}else{if(a[m]<t&&t<=a[r])l=m+1;else r=m-1;}}
        System.out.println(ans);
    }
}
`,
    },
  },
  {
    id: "find-min-rotated-sorted",
    slug: "find-min-rotated-sorted",
    title: "23. Find Minimum in Rotated Sorted Array",
    difficulty: "Medium",
    topic: "Binary Search",
    acceptance: "50.8%",
    companies: ["Amazon", "Microsoft", "Goldman Sachs"],
    diagramType: "array_pointers",
    description: `Find the minimum element of a rotated sorted array with unique elements in \`O(log n)\`.`,
    examples: [{ input: "nums = [3, 4, 5, 1, 2]", output: "1" }],
    constraints: ["1 <= nums.length <= 5000"],
    defaultStdin: "3 4 5 1 2",
    templates: {
      python: `def findMin(nums):
    left, right = 0, len(nums) - 1
    while left < right:
        mid = (left + right) // 2
        if nums[mid] > nums[right]: left = mid + 1
        else: right = mid
    return nums[left]

nums = [3, 4, 5, 1, 2]
print("Minimum:", findMin(nums))
`,
      javascript: `function findMin(nums) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] > nums[right]) left = mid + 1;
    else right = mid;
  }
  return nums[left];
}
const nums = [3, 4, 5, 1, 2];
console.log("Minimum:", findMin(nums));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a={3,4,5,1,2}; int l=0,r=a.size()-1;
    while(l<r){int m=(l+r)/2;if(a[m]>a[r])l=m+1;else r=m;}
    cout<<a[l]<<endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] a={3,4,5,1,2};int l=0,r=a.length-1;
        while(l<r){int m=(l+r)/2;if(a[m]>a[r])l=m+1;else r=m;}
        System.out.println(a[l]);
    }
}
`,
    },
  },
  {
    id: "find-peak-element",
    slug: "find-peak-element",
    title: "24. Find Peak Element",
    difficulty: "Medium",
    topic: "Binary Search",
    acceptance: "46.0%",
    companies: ["Meta", "Google", "Amazon"],
    diagramType: "array_pointers",
    description: `A peak element is strictly greater than its neighbors. Return the index of any peak element in \`O(log n)\` time.`,
    examples: [{ input: "nums = [1, 2, 1, 3, 5, 6, 4]", output: "5" }],
    constraints: ["1 <= nums.length <= 1000"],
    defaultStdin: "1 2 1 3 5 6 4",
    templates: {
      python: `def findPeakElement(nums):
    left, right = 0, len(nums) - 1
    while left < right:
        mid = (left + right) // 2
        if nums[mid] < nums[mid + 1]: left = mid + 1
        else: right = mid
    return left

nums = [1, 2, 1, 3, 5, 6, 4]
print("Peak index:", findPeakElement(nums))
`,
      javascript: `function findPeakElement(nums) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] < nums[mid + 1]) left = mid + 1;
    else right = mid;
  }
  return left;
}
const nums = [1, 2, 1, 3, 5, 6, 4];
console.log("Peak index:", findPeakElement(nums));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a={1,2,1,3,5,6,4};int l=0,r=a.size()-1;
    while(l<r){int m=(l+r)/2;if(a[m]<a[m+1])l=m+1;else r=m;}
    cout<<l<<endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] a={1,2,1,3,5,6,4};int l=0,r=a.length-1;
        while(l<r){int m=(l+r)/2;if(a[m]<a[m+1])l=m+1;else r=m;}
        System.out.println(l);
    }
}
`,
    },
  },
  {
    id: "koko-eating-bananas",
    slug: "koko-eating-bananas",
    title: "25. Koko Eating Bananas",
    difficulty: "Medium",
    topic: "Binary Search",
    acceptance: "49.1%",
    companies: ["Google", "Amazon", "Meta", "DoorDash"],
    diagramType: "array_pointers",
    description: `Binary search on answer space: find the minimum integer eating speed \`k\` such that Koko finishes all banana piles within \`h\` hours.`,
    examples: [{ input: "piles = [3, 6, 7, 11], h = 8", output: "4" }],
    constraints: ["1 <= piles.length <= h <= 10^5"],
    defaultStdin: "3 6 7 11\n8",
    templates: {
      python: `def minEatingSpeed(piles, h):
    left, right = 1, max(piles)
    while left < right:
        mid = (left + right) // 2
        hours = sum((p + mid - 1) // mid for p in piles)
        if hours <= h: right = mid
        else: left = mid + 1
    return left

piles = [3, 6, 7, 11]
print("Min speed k:", minEatingSpeed(piles, 8))
`,
      javascript: `function minEatingSpeed(piles, h) {
  let left = 1, right = Math.max(...piles);
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const hours = piles.reduce((s, p) => s + Math.ceil(p / mid), 0);
    if (hours <= h) right = mid;
    else left = mid + 1;
  }
  return left;
}
const piles = [3, 6, 7, 11];
console.log("Min speed k:", minEatingSpeed(piles, 8));
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> p={3,6,7,11};int h=8,l=1,r=*max_element(p.begin(),p.end());
    while(l<r){int m=(l+r)/2;long hrs=0;for(int x:p)hrs+=(x+m-1)/m;if(hrs<=h)r=m;else l=m+1;}
    cout<<l<<endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] p={3,6,7,11};int h=8,l=1,r=11;
        while(l<r){int m=(l+r)/2;long hrs=0;for(int x:p)hrs+=(x+m-1)/m;if(hrs<=h)r=m;else l=m+1;}
        System.out.println(l);
    }
}
`,
    },
  },
  {
    id: "valid-palindrome",
    slug: "valid-palindrome",
    title: "26. Valid Palindrome",
    difficulty: "Easy",
    topic: "Strings & Sliding Window",
    acceptance: "47.9%",
    companies: ["Meta", "Microsoft", "TCS"],
    diagramType: "array_pointers",
    description: `Considering only alphanumeric characters and ignoring cases, determine whether a string is a palindrome.`,
    examples: [{ input: 's = "A man, a plan, a canal: Panama"', output: "true" }],
    constraints: ["1 <= s.length <= 2*10^5"],
    defaultStdin: "racecar",
    templates: {
      python: `def isPalindrome(chars):
    left, right = 0, len(chars) - 1
    while left < right:
        while left < right and not chars[left].isalnum(): left += 1
        while left < right and not chars[right].isalnum(): right -= 1
        if chars[left].lower() != chars[right].lower():
            return False
        left += 1
        right -= 1
    return True

chars = list("racecar")
print("Is palindrome:", isPalindrome(chars))
`,
      javascript: `function isPalindrome(chars) {
  let left = 0, right = chars.length - 1;
  while (left < right) {
    if (chars[left].toLowerCase() !== chars[right].toLowerCase()) return false;
    left++; right--;
  }
  return true;
}
const chars = "racecar".split("");
console.log("Is palindrome:", isPalindrome(chars));
`,
      cpp: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s = "racecar"; int l=0, r=s.size()-1; bool ok=true;
    while(l<r) if(s[l++]!=s[r--]) ok=false;
    cout << (ok ? "true" : "false") << endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        String s = "racecar"; int l=0, r=s.length()-1; boolean ok=true;
        while(l<r) if(s.charAt(l++)!=s.charAt(r--)) ok=false;
        System.out.println(ok);
    }
}
`,
    },
  },
  {
    id: "valid-anagram",
    slug: "valid-anagram",
    title: "27. Valid Anagram",
    difficulty: "Easy",
    topic: "Strings & Sliding Window",
    acceptance: "64.8%",
    companies: ["Amazon", "Google", "Uber", "Wipro"],
    diagramType: "array_pointers",
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`.`,
    examples: [{ input: 's = "anagram", t = "nagaram"', output: "true" }],
    constraints: ["1 <= s.length, t.length <= 5*10^4"],
    defaultStdin: "anagram\nnagaram",
    templates: {
      python: `def isAnagram(s, t):
    if len(s) != len(t): return False
    freq = [0] * 26
    for i in range(len(s)):
        freq[ord(s[i]) - 97] += 1
        freq[ord(t[i]) - 97] -= 1
    return all(x == 0 for x in freq)

print("Anagram:", isAnagram("anagram", "nagaram"))
`,
      javascript: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const freq = Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    freq[s.charCodeAt(i) - 97]++;
    freq[t.charCodeAt(i) - 97]--;
  }
  return freq.every((x) => x === 0);
}
console.log("Anagram:", isAnagram("anagram", "nagaram"));
`,
      cpp: `#include <iostream>
#include <algorithm>
using namespace std;
int main() {
    string s = "anagram", t = "nagaram";
    sort(s.begin(), s.end()); sort(t.begin(), t.end());
    cout << (s == t ? "true" : "false") << endl;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        char[] a = "anagram".toCharArray(), b = "nagaram".toCharArray();
        Arrays.sort(a); Arrays.sort(b);
        System.out.println(Arrays.equals(a, b));
    }
}
`,
    },
  },
  {
    id: "longest-substring-without-repeating",
    slug: "longest-substring-without-repeating",
    title: "28. Longest Substring Without Repeating",
    difficulty: "Medium",
    topic: "Strings & Sliding Window",
    acceptance: "35.1%",
    companies: ["Amazon", "Google", "Meta", "Microsoft"],
    diagramType: "array_pointers",
    description: `Find the length of the longest substring without duplicate characters using a sliding window.`,
    examples: [{ input: 's = "abcabcbb"', output: "3", explanation: '"abc"' }],
    constraints: ["0 <= s.length <= 5*10^4"],
    defaultStdin: "abcabcbb",
    templates: {
      python: `def lengthOfLongestSubstring(chars):
    last = {}
    left = best = 0
    for right, ch in enumerate(chars):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best

chars = list("abcabcbb")
print("Max unique window:", lengthOfLongestSubstring(chars))
`,
      javascript: `function lengthOfLongestSubstring(chars) {
  const last = new Map();
  let left = 0, best = 0;
  for (let right = 0; right < chars.length; right++) {
    const ch = chars[right];
    if (last.has(ch) && last.get(ch) >= left) left = last.get(ch) + 1;
    last.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
const chars = "abcabcbb".split("");
console.log("Max unique window:", lengthOfLongestSubstring(chars));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    string s = "abcabcbb"; vector<int> last(256, -1); int l=0, best=0;
    for (int r=0; r<(int)s.size(); r++) {
        l = max(l, last[(unsigned char)s[r]] + 1);
        last[(unsigned char)s[r]] = r;
        best = max(best, r - l + 1);
    }
    cout << best << endl;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        String s = "abcabcbb"; int[] last = new int[256]; Arrays.fill(last,-1); int l=0,best=0;
        for (int r=0;r<s.length();r++){l=Math.max(l,last[s.charAt(r)]+1);last[s.charAt(r)]=r;best=Math.max(best,r-l+1);}
        System.out.println(best);
    }
}
`,
    },
  },
  {
    id: "longest-repeating-char-replacement",
    slug: "longest-repeating-char-replacement",
    title: "29. Longest Repeating Character Replacement",
    difficulty: "Medium",
    topic: "Strings & Sliding Window",
    acceptance: "54.6%",
    companies: ["Google", "Amazon", "Adobe"],
    diagramType: "array_pointers",
    description: `Replace at most \`k\` characters in \`s\` so the chosen substring contains identical uppercase letters. Return maximum length.`,
    examples: [{ input: 's = "AABABBA", k = 1', output: "4" }],
    constraints: ["1 <= s.length <= 10^5"],
    defaultStdin: "AABABBA\n1",
    templates: {
      python: `def characterReplacement(chars, k):
    freq = {}
    left = maxf = best = 0
    for right, ch in enumerate(chars):
        freq[ch] = freq.get(ch, 0) + 1
        maxf = max(maxf, freq[ch])
        while (right - left + 1) - maxf > k:
            freq[chars[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best

chars = list("AABABBA")
print("Longest window:", characterReplacement(chars, 1))
`,
      javascript: `function characterReplacement(chars, k) {
  const freq = {};
  let left = 0, maxf = 0, best = 0;
  for (let right = 0; right < chars.length; right++) {
    const ch = chars[right];
    freq[ch] = (freq[ch] || 0) + 1;
    maxf = Math.max(maxf, freq[ch]);
    while ((right - left + 1) - maxf > k) {
      freq[chars[left++]]--;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
const chars = "AABABBA".split("");
console.log("Longest window:", characterReplacement(chars, 1));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    string s = "AABABBA"; int k=1, l=0, mf=0, best=0; vector<int> c(26,0);
    for(int r=0;r<(int)s.size();r++){mf=max(mf,++c[s[r]-'A']);while(r-l+1-mf>k)c[s[l++]-'A']--;best=max(best,r-l+1);}
    cout<<best<<endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        String s="AABABBA";int k=1,l=0,mf=0,best=0;int[]c=new int[26];
        for(int r=0;r<s.length();r++){mf=Math.max(mf,++c[s.charAt(r)-'A']);while(r-l+1-mf>k)c[s.charAt(l++)-'A']--;best=Math.max(best,r-l+1);}
        System.out.println(best);
    }
}
`,
    },
  },
  {
    id: "group-anagrams",
    slug: "group-anagrams",
    title: "30. Group Anagrams",
    difficulty: "Medium",
    topic: "Strings & Sliding Window",
    acceptance: "68.9%",
    companies: ["Amazon", "Meta", "Google", "Affirm"],
    diagramType: "array_pointers",
    description: `Group strings that are anagrams of each other together using canonical character signatures.`,
    examples: [{ input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }],
    constraints: ["1 <= strs.length <= 10^4"],
    defaultStdin: "eat tea tan ate nat bat",
    templates: {
      python: `from collections import defaultdict

def groupAnagrams(words):
    groups = defaultdict(list)
    for i, w in enumerate(words):
        key = "".join(sorted(w))
        groups[key].append(w)
    return list(groups.values())

words = ["eat", "tea", "tan", "ate", "nat", "bat"]
print("Groups:", groupAnagrams(words))
`,
      javascript: `function groupAnagrams(words) {
  const groups = new Map();
  for (let i = 0; i < words.length; i++) {
    const key = words[i].split("").sort().join("");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(words[i]);
  }
  return Array.from(groups.values());
}
const words = ["eat", "tea", "tan", "ate", "nat", "bat"];
console.log("Groups:", JSON.stringify(groupAnagrams(words)));
`,
      cpp: `#include <iostream>
#include <vector>
#include <map>
#include <algorithm>
using namespace std;
int main() {
    vector<string> ws = {"eat","tea","tan","ate","nat","bat"};
    map<string, vector<string>> g;
    for (auto& w : ws) { string k = w; sort(k.begin(), k.end()); g[k].push_back(w); }
    cout << g.size() << " groups" << endl;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        String[] ws={"eat","tea","tan","ate","nat","bat"};
        Map<String,List<String>> g=new HashMap<>();
        for(String w:ws){char[]c=w.toCharArray();Arrays.sort(c);g.computeIfAbsent(new String(c),k->new ArrayList<>()).add(w);}
        System.out.println(g.values());
    }
}
`,
    },
  },
];
